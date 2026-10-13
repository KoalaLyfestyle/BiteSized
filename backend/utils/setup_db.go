package utils

import (
	"bitesized-backend/config"
	"fmt"
	"log"
	"os"
	"strings"
)

// SplitSQL splits a script into statements on semicolons that end a line.
// Lines starting with "--" are comments. This keeps multiStatements off in
// the DSN.
func SplitSQL(script string) []string {
	var statements []string
	var current strings.Builder
	for _, line := range strings.Split(script, "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "--") {
			continue
		}
		current.WriteString(line)
		current.WriteString("\n")
		if strings.HasSuffix(trimmed, ";") {
			stmt := strings.TrimSuffix(strings.TrimSpace(current.String()), ";")
			statements = append(statements, stmt)
			current.Reset()
		}
	}
	if rest := strings.TrimSpace(current.String()); rest != "" {
		statements = append(statements, rest)
	}
	return statements
}

// ExecuteSQLFile runs every statement in a SQL file against config.DB.
func ExecuteSQLFile(filepath string) error {
	content, err := os.ReadFile(filepath)
	if err != nil {
		return fmt.Errorf("read %s: %w", filepath, err)
	}
	for _, stmt := range SplitSQL(string(content)) {
		if _, err := config.DB.Exec(stmt); err != nil {
			return fmt.Errorf("run %s: %w", filepath, err)
		}
	}
	log.Printf("Executed SQL file: %s", filepath)
	return nil
}

// SetupDatabase creates the tables and loads the labelled sample data.
func SetupDatabase(dir string) error {
	for _, name := range []string{"1-schema.sql", "2-seed.sql"} {
		if err := ExecuteSQLFile(dir + "/" + name); err != nil {
			return err
		}
	}
	return nil
}
