import { Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import type { User } from '@/lib/auth/auth-server';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import SignoutBtn from './signout-btn';

interface NavbarProps {
  user: User | null;
}

const Navbar = ({ user }: NavbarProps) => {
  return (
    <nav className="fixed flex h-14 w-full items-center justify-between border-b bg-white px-4 sm:h-16">
      <div>
        <Link
          href="/"
          className="text-primary text-md flex items-center gap-2 font-semibold sm:text-lg md:text-xl"
        >
          <Briefcase />
          <span className="hidden sm:inline">Job Tracker</span>
        </Link>
      </div>
      <>
        {user ? (
          <div className="flex items-center gap-4">
            <Button
              render={<Link href="/dashboard" />}
              className="bg-primary hover:bg-primary/90 cursor-pointer px-4 py-5 font-bold"
            >
              Dashboard
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="cursor-pointer rounded-full px-0"
                  />
                }
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.image ?? ''}
                    alt={user.name + ' ' + user.lastName}
                    className="grayscale"
                  />
                  <AvatarFallback className="text-lg font-bold">
                    {user.name.toUpperCase()[0] +
                      user.lastName.toUpperCase()[0]}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <h3 className="font-semibold text-black">{user.name}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <SignoutBtn />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="cursor-pointer px-4 py-5 font-bold text-gray-700 hover:text-black"
              render={<Link href="/auth/signin" />}
            >
              Log in
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 cursor-pointer px-4 py-5 font-bold"
              render={<Link href="/auth/signup" />}
            >
              Start for free
            </Button>
          </div>
        )}
      </>
    </nav>
  );
};

export default Navbar;
