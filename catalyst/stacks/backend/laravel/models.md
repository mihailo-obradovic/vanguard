# Laravel — Models and Persistence

**Layer:** Backend
**Tool:** Laravel 13 · Eloquent · PHP 8.3 attributes

Eloquent in Laravel 13, and where domain logic lives. Read this when adding a model, a column, or behavior that is about the domain rather than about a request.

**Most Laravel material you will find — and most model code an assistant will produce from memory — is written in the Laravel 10/11 style.** That style still runs, but it is not what this module writes. The differences are mechanical and listed below; check new model code against them.

## Model shape

```php
#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
        ];
    }
}
```

What changed from the older style:

| Older style | Laravel 13 |
| --- | --- |
| `protected $fillable = [...]` | `#[Fillable([...])]` class attribute |
| `protected $hidden = [...]` | `#[Hidden([...])]` class attribute |
| `protected $casts = [...]` | `protected function casts(): array` |
| `protected $table`, `$appends`, `$touches`, `$dateFormat` | `#[Table]`, `#[Appends]`, `#[Touches]`, `#[DateFormat]` |
| `protected static function booted()` | `#[Boot]`, `#[ObservedBy]`, `#[ScopedBy]` |
| `$policies` array in a provider | `#[UsePolicy(...)]` on the model |

The `casts()` method exists because a property could not call anything — a cast needing a constructor argument (`AsEncryptedCollection::class`, a custom caster with parameters) had to be worked around. The method form removes the special case, so use it even when the array is static.

## Casts

- **`'password' => 'hashed'`** means nothing else ever calls `Hash::make()`. Assign the plaintext and Eloquent hashes on write — controllers, factories, and seeders all just assign.
- **Cast enums to the enum class** (`'role' => Role::class`). The model then hands back a `Role`, so `$user->role === Role::Admin` is a type-checked comparison rather than a string typo waiting to happen. Unwrap to `->value` only at the Resource boundary.
- Cast every timestamp to `datetime`. A string that looks like a date is not a date.

## Enums

String-backed, in `app/Enums/`, and deliberately bare:

```php
enum Role: string
{
    case User = 'user';
    case Admin = 'admin';
}
```

PascalCase cases, lowercase values. The same enum then drives the model cast, `Rule::enum()` in validation, and the column default in the migration (`->default(Role::User->value)`) — one definition, three enforcement points.

Resist adding `label()` and `values()` helpers to every enum on principle. Add them when something actually needs them; a display label usually belongs to the frontend, and the backend does not have the user's locale.

## Where domain logic goes

On the model, as a method that says what it does:

```php
/**
 * Assign a new email address, resetting verification if it actually changed.
 *
 * Returns true when the email changed, signalling the caller to re-send the
 * verification notification after saving.
 */
public function changeEmail(string $email): bool
{
    if ($email === $this->email) {
        return false;
    }

    $this->email = $email;
    $this->email_verified_at = null;

    return true;
}
```

The rule "verification resets when the address changes" now exists once. Every caller — admin user management, self-service profile, an import — gets it, and no controller can forget.

- Predicates that read as domain vocabulary (`isAdmin()`, `isOverdue()`) beat the comparison spelled out at each call site.
- A method that returns "did something meaningful happen" lets the caller own the side effect (sending mail, dispatching a job) without the model reaching for a facade.
- Logic moves to `app/Services/` when it spans several models or owns a transaction boundary. That is the trigger — not the number of methods on the model.

## Migrations

- A schema change ships with its migration in the same change, and after first deploy migrations are **forward-only**: a change is a new migration, never an edit to one that has run. Editing the base `create_users_table` to add a column is fine on day one and a data-loss bug on day two.
- Columns backed by an enum use `string` with the enum-derived default, not a database `enum` type — the database enum has to be altered in lockstep with the PHP one and gains nothing:

  ```php
  $table->string('role')->default(Role::User->value);
  ```
- Business invariants that must hold under concurrency go in the schema — unique, check, and foreign-key constraints. A `->where(...)->exists()` check in a service is a race, not enforcement.
- Read what `--seed` and any generated migration actually contain before running them.

## Factories and seeders

- **Factories are the test fixture mechanism**; seeders are for local and demo data. A test that depends on a seeder is a test that breaks when the demo data changes.
- Give a factory named states for the variants tests care about (`admin()`, `unverified()`) rather than passing attribute arrays at each call site.
- Pick the factory's default state deliberately: `'email_verified_at' => now()` means the ordinary case is a verified user and the exception is explicit.
