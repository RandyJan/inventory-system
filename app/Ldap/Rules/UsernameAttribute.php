<?php

namespace App\Ldap\Rules;

use LdapRecord\Laravel\Auth\Rule;
use LdapRecord\Models\Model as LdapModel;
use Illuminate\Database\Eloquent\Model as DatabaseModel;

class UsernameAttribute extends Rule
{
    /**
     * Check if the rule passes validation.
     */
    public function passes(LdapModel $user, DatabaseModel $model = null): bool
    {
        return true; // Always allow, we just need to set the attribute
    }
}
