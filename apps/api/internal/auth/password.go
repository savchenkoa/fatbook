package auth

import (
	"github.com/alexedwards/argon2id"
	"strings"
)

func NormalizeEmail(email string) string { return strings.ToLower(strings.TrimSpace(email)) }

func HashPassword(password string) (string, error) {
	return argon2id.CreateHash(password, &argon2id.Params{
		Memory: 64 * 1024, Iterations: 3, Parallelism: 2, SaltLength: 16, KeyLength: 32,
	})
}
