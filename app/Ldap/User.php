<?php

namespace App\Ldap;

use LdapRecord\Models\ActiveDirectory\User as BaseUser;

class User extends BaseUser
{
    /**
     * The object classes of the LDAP model.
     */
    public static array $objectClasses = [
        'top',
        'person',
        'organizationalperson',
        'user',
    ];
}
