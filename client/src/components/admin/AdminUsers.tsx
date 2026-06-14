import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Users, Shield, UserX, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest, getCsrfHeaders } from '@/lib/queryClient';
import { EmptyState } from '@/components/EmptyState';
import { getRoleBadge } from './adminUtils';
import { AdminPagination } from './AdminPagination';

const PER_PAGE = 20;

export function AdminUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isChangingRole, setIsChangingRole] = useState<string | null>(null);

  const { data: usersData, isLoading } = useQuery<{ users: any[]; total: number; pages: number }>({
    queryKey: ['/api/admin/users/paginated', page, PER_PAGE],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/paginated?page=${page}&limit=${PER_PAGE}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const users = usersData?.users || [];
  const total = usersData?.total || 0;
  const totalPages = usersData?.pages || 1;

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => apiRequest('DELETE', `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/paginated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'User deleted successfully',
        description: 'The user and all their data have been permanently deleted.',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete user',
        description: error?.message || 'An error occurred while deleting the user.',
        variant: 'destructive',
      });
    },
  });

  const changeRole = async (userId: string, userEmail: string, action: 'promote' | 'demote') => {
    setIsChangingRole(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'PUT',
        headers: await getCsrfHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to ${action} user`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/paginated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'Success',
        description:
          action === 'promote'
            ? `${userEmail} has been promoted to admin`
            : `${userEmail} has been demoted to user`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        description: `Failed to ${action} user`,
        variant: 'destructive',
      });
    } finally {
      setIsChangingRole(null);
    }
  };

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      searchTerm === '' ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const RoleActionButton = ({ user }: { user: any }) =>
    user.role !== 'admin' ? (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isChangingRole === user.id}
            data-testid={`button-promote-user-${user.id}`}
          >
            <Shield className="w-4 h-4 mr-1" />
            Promote
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote User to Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote {user.email} to admin? This will give them full
              administrative privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => changeRole(user.id, user.email, 'promote')}
              data-testid={`confirm-promote-${user.id}`}
            >
              Promote to Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ) : (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isChangingRole === user.id}
            data-testid={`button-demote-user-${user.id}`}
          >
            <UserX className="w-4 h-4 mr-1" />
            Demote
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Demote Admin to User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to demote {user.email} from admin? This will remove their
              administrative privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => changeRole(user.id, user.email, 'demote')}
              data-testid={`confirm-demote-${user.id}`}
            >
              Demote to User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

  const DeleteUserButton = ({ user }: { user: any }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={deleteUserMutation.isPending}
          data-testid={`button-delete-user-${user.id}`}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {user.email}? This action cannot be undone and will
            permanently remove the user and all their data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteUserMutation.mutate(user.id)}
            data-testid={`confirm-delete-user-${user.id}`}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by Email, First Name, or Last Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-users"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-role-filter">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>{filteredUsers.length} users found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => {
                      const fullName =
                        [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
                      return (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{fullName}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            {user.createdAt
                              ? format(new Date(user.createdAt), 'MMM dd, yyyy')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <RoleActionButton user={user} />
                              <DeleteUserButton user={user} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {filteredUsers.map((user: any) => {
                  const fullName =
                    [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A';
                  return (
                    <div
                      key={user.id}
                      className="rounded-xl border border-border p-4"
                      data-testid={`card-user-${user.id}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{user.email}</span>
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {fullName} · Joined{' '}
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <RoleActionButton user={user} />
                        <DeleteUserButton user={user} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!isLoading && filteredUsers.length > 0 && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={PER_PAGE}
              label="users"
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUsers;
