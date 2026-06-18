<?php

namespace App\Ldap\Scopes;

use LdapRecord\Models\Model;
use LdapRecord\Models\Scope;
use LdapRecord\Query\Model\Builder;

class DSWD4A implements Scope
{
    /**
     * Apply the scope to the given query.
     */
    public function apply(Builder $query, Model $model): void
    {
        // ...
        // $query->in('OU=FO4A,DC=ENTDSWD,DC=LOCAL');
        // logger('DSWD4A scope executed');

        // $query->whereEquals(
        //     'memberof',
        //     'CN=4A_SSLVPN_GRP_ACL,OU=Groups,OU=FO4A,DC=ENTDSWD,DC=LOCAL'
        // );
    }
}
