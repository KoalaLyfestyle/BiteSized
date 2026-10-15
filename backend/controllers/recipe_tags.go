package controllers

import (
	"bitesized-backend/models"
	"database/sql"
	"strconv"
	"strings"
	"unicode/utf8"
)

// Tag limits. maxTagName matches tags.name VARCHAR(50).
const (
	maxTags    = 10
	maxTagName = 50
)

// querier is what both *sql.DB and *sql.Tx offer, so reads and writes can run
// inside or outside a transaction.
type querier interface {
	Exec(query string, args ...any) (sql.Result, error)
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args ...any) *sql.Row
}

// cleanTags trims each tag, drops case-insensitive duplicates (the tags.name
// unique index ignores case), and returns a message if the list is invalid.
func cleanTags(tags []string) ([]string, string) {
	out := []string{}
	seen := map[string]bool{}
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		n := utf8.RuneCountInString(tag)
		if n == 0 || n > maxTagName {
			return nil, "each tag must be 1 to " + strconv.Itoa(maxTagName) + " characters"
		}
		key := strings.ToLower(tag)
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, tag)
	}
	if len(out) > maxTags {
		return nil, "at most " + strconv.Itoa(maxTags) + " tags"
	}
	return out, ""
}

const tagsQuery = "SELECT rt.recipe_id, t.name FROM recipe_tags rt JOIN tags t ON t.id = rt.tag_id"

// attachTags fills Tags on each recipe ([] when it has none). With one recipe
// it reads only that recipe's tags; otherwise it reads them all in one query.
func attachTags(q querier, recipes []models.Recipe) error {
	byID := map[int]int{}
	for i := range recipes {
		recipes[i].Tags = []string{}
		byID[recipes[i].ID] = i
	}
	if len(recipes) == 0 {
		return nil
	}
	var rows *sql.Rows
	var err error
	if len(recipes) == 1 {
		rows, err = q.Query(tagsQuery+" WHERE rt.recipe_id = ? ORDER BY t.name", recipes[0].ID)
	} else {
		rows, err = q.Query(tagsQuery + " ORDER BY t.name")
	}
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var recipeID int
		var name string
		if err := rows.Scan(&recipeID, &name); err != nil {
			return err
		}
		if i, ok := byID[recipeID]; ok {
			recipes[i].Tags = append(recipes[i].Tags, name)
		}
	}
	return rows.Err()
}

// fetchRecipe reads one recipe with its tags.
func fetchRecipe(q querier, id int64) (models.Recipe, error) {
	recipe, err := scanRecipe(q.QueryRow("SELECT "+recipeColumns+" FROM recipes WHERE id = ?", id))
	if err != nil {
		return recipe, err
	}
	list := []models.Recipe{recipe}
	if err := attachTags(q, list); err != nil {
		return recipe, err
	}
	return list[0], nil
}

// replaceTags makes tags the recipe's whole tag list, creating tags that do
// not exist yet. A tag that differs only in case reuses the stored one.
func replaceTags(q querier, recipeID int64, tags []string) error {
	ids := []int64{}
	seen := map[int64]bool{}
	for _, name := range tags {
		// LAST_INSERT_ID(id) makes an existing tag report its own id.
		res, err := q.Exec("INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)", name)
		if err != nil {
			return err
		}
		id, err := res.LastInsertId()
		if err != nil {
			return err
		}
		if !seen[id] {
			seen[id] = true
			ids = append(ids, id)
		}
	}
	if _, err := q.Exec("DELETE FROM recipe_tags WHERE recipe_id = ?", recipeID); err != nil {
		return err
	}
	for _, id := range ids {
		if _, err := q.Exec("INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)", recipeID, id); err != nil {
			return err
		}
	}
	return nil
}
