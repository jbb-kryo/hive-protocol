'use client';

import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Plus, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TeamSwitcher() {
  const router = useRouter();
  const { organizations, currentOrganization, switchOrganization, loading } = useOrganizations();

  if (loading) {
    return (
      <Button variant="ghost" disabled className="w-full justify-between">
        <span>Loading...</span>
      </Button>
    );
  }

  if (organizations.length === 0) {
    return (
      <Button
        variant="ghost"
        onClick={() => router.push('/teams/create')}
        className="w-full justify-start gap-2"
      >
        <Plus className="h-4 w-4" />
        Create Team
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          <div className="flex items-center gap-2">
            {currentOrganization ? (
              <>
                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {currentOrganization.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[120px]">{currentOrganization.name}</span>
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                <span>Personal</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Teams</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => switchOrganization(null as any)}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Personal</span>
            </div>
            {!currentOrganization && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrganization(org)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{org.name}</span>
              </div>
              {currentOrganization?.id === org.id && <Check className="h-4 w-4" />}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/teams/create')}
          className="cursor-pointer text-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Team
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push('/teams')}
          className="cursor-pointer"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Manage Teams
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
