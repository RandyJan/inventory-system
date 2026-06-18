# LDAP Authentication Configuration

This application has been configured to use **LdapRecord** for synchronized database LDAP authentication.

## Overview

The application now authenticates users against Active Directory (LDAP) and automatically creates/syncs user records in the local database. This allows:
- Users to login with their AD credentials
- User information to be synchronized from LDAP to the database
- Relational data to be attached to users (posts, attachments, etc.)
- Two-factor authentication to work alongside LDAP authentication

## Configuration Files

### 1. `config/ldap.php`
Contains LDAP connection settings:
- LDAP host, port, credentials
- Base DN for LDAP searches
- SSL/TLS settings
- Connection timeout and options

### 2. `config/auth.php`
Updated to use LDAP authentication provider:
- **Driver**: Changed from `eloquent` to `ldap`
- **LDAP Model**: `App\Ldap\User` - represents LDAP user objects
- **Database Model**: `App\Models\User` - local database user model
- **Sync Attributes**: Maps LDAP attributes to database columns:
  - `name` ← `cn` (Common Name)
  - `email` ← `mail` (Email Address)
- **Sync Existing**: Matches existing users by `email` field

### 3. `config/fortify.php`
Disabled features that are incompatible with LDAP:
- ❌ **Registration** - Users exist in AD, not created locally
- ❌ **Password Reset** - Passwords managed through Active Directory
- ❌ **Email Verification** - Not needed for AD users
- ✅ **Two-Factor Authentication** - Enabled for additional security

## Models

### `App\Models\User`
Updated with LDAP traits:
- Implements `LdapAuthenticatable` interface
- Uses `AuthenticatesWithLdap` trait
- Added `guid` and `domain` to fillable attributes

### `App\Ldap\User`
LDAP model representing Active Directory users:
- Object classes: `top`, `person`, `organizationalperson`, `user`
- Attributes: `cn`, `mail`, `objectguid`, `samaccountname`, `userprincipalname`

## Database

The `users` table includes these LDAP-specific columns:
- `guid` (varchar, unique) - Active Directory object GUID
- `domain` (varchar) - LDAP domain name

## Authentication Flow

1. User enters email/username and password on login page
2. Fortify passes credentials to LDAP authentication provider
3. LdapRecord attempts to bind to LDAP server with provided credentials
4. If successful, user attributes are fetched from LDAP
5. User is created or updated in local database with synced attributes
6. User is logged into the application
7. If 2FA is enabled for user, 2FA challenge is presented

## Environment Variables

Ensure these variables are set in your `.env` file:

```env
# LDAP Connection
LDAP_HOST=your-ldap-server.example.com
LDAP_USERNAME=cn=service-account,dc=example,dc=com
LDAP_PASSWORD=service-account-password
LDAP_PORT=389
LDAP_BASE_DN=dc=example,dc=com
LDAP_TIMEOUT=5
LDAP_SSL=false
LDAP_TLS=false

# LDAP Options
LDAP_LOGGING=true
LDAP_CACHE=false
```

## Testing

Test LDAP connection:
```bash
php artisan ldap:test
```

This will verify:
- Connection to LDAP server
- Authentication with service account
- Response time

## Important Notes

1. **Password Storage**: Passwords are NOT stored in the local database. Set `sync_passwords` to `false` to prevent this.

2. **User Creation**: Users are automatically created on first login. No registration form needed.

3. **Password Changes**: Users must change passwords through Active Directory, not the application.

4. **GUID Uniqueness**: The `guid` column ensures each LDAP user maps to only one database user.

5. **Two-Factor Authentication**: Can be enabled per-user for additional security layer on top of LDAP auth.

## Troubleshooting

### Login fails but LDAP connection works
- Check that user exists in LDAP base DN
- Verify user's `mail` attribute matches login email
- Check Laravel logs for specific error messages

### User not syncing properly
- Verify `sync_attributes` mapping in `config/auth.php`
- Check that LDAP attributes exist on the user object
- Enable LDAP logging to see sync details

### "Too many redirects" error
- Clear config cache: `php artisan config:clear`
- Clear route cache: `php artisan route:clear`
- Check that auth middleware is properly configured

## Related Files

- [config/ldap.php](config/ldap.php) - LDAP connection configuration
- [config/auth.php](config/auth.php) - Authentication provider configuration
- [config/fortify.php](config/fortify.php) - Fortify features configuration
- [app/Models/User.php](app/Models/User.php) - Database user model
- [app/Ldap/User.php](app/Ldap/User.php) - LDAP user model
- [app/Providers/FortifyServiceProvider.php](app/Providers/FortifyServiceProvider.php) - Fortify configuration
- [database/migrations/2025_01_01_000000_add_ldap_columns_to_users_table.php](database/migrations/2025_01_01_000000_add_ldap_columns_to_users_table.php) - LDAP database columns

## Documentation

For more information, see:
- [LdapRecord Documentation](https://ldaprecord.com/)
- [LdapRecord Laravel Authentication](https://ldaprecord.com/docs/laravel/v3/auth/database)
