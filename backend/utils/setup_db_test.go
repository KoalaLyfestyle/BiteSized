package utils

import (
	"os"
	"testing"
)

func TestSplitSQLSeedFiles(t *testing.T) {
	for file, want := range map[string]int{"../sql/1-schema.sql": 6, "../sql/2-seed.sql": 4} {
		content, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		if got := len(SplitSQL(string(content))); got != want {
			t.Fatalf("%s: expected %d statements, got %d", file, want, got)
		}
	}
}
