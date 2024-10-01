"use client";

import { DataTable } from "@/app/(app)/_components/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import React, { useMemo } from "react";
import { getColumns, type UsersData } from "./columns";
import { useDataTable } from "@/hooks/use-data-table";
import type {
    DataTableFilterableColumn,
    DataTableSearchableColumn,
} from "@/types/data-table";
import { type getPaginatedUsersQuery } from "@/server/actions/user/queries";
import {Database} from "@/types/database.types";

/** @learn more about data-table at shadcn ui website @see https://ui.shadcn.com/docs/components/data-table */

type User = Database['public']['Tables']['account']['Row'];

const userRoles: User['role'][] = ['User', 'Admin', 'Super Admin'];

const filterableColumns: DataTableFilterableColumn<UsersData>[] = [
    {
        id: "role",
        title: "Role",
        options: userRoles.map((v) => ({
            label: v,
            value: v,
        })),
    },
];

type UsersTableProps = {
    usersPromise: ReturnType<typeof getPaginatedUsersQuery>;
};

const searchableColumns: DataTableSearchableColumn<UsersData>[] = [
    { id: "email", placeholder: "Search email..." },
];

export function UsersTable({ usersPromise }: UsersTableProps) {
    const { data, pageCount, total } = React.use(usersPromise);

    const columns = useMemo<ColumnDef<UsersData, unknown>[]>(
        () => getColumns(),
        [],
    );

    const usersData: UsersData[] = data.map((user) => {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.email_verified ? "verified" : "unverified",
            createdAt: user.created_at,
        };
    });

    const { table } = useDataTable({
        data: usersData,
        columns,
        pageCount,
        searchableColumns,
        filterableColumns,
    });

    return (
        <DataTable
            table={table}
            columns={columns}
            filterableColumns={filterableColumns}
            searchableColumns={searchableColumns}
            totalRows={total}
        />
    );
}