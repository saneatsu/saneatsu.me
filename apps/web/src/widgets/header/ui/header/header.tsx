import { UserAvatar } from '@/entities/user';

interface HeaderProps {
  /** Current user information */
  user?: {
    name: string;
    email: string;
    avatar?: string;
  } | null;
  /** Navigation items */
  navigation?: Array<{
    label: string;
    href: string;
  }>;
  /** Additional CSS classes */
  className?: string;
}

export function Header({ user, navigation = [], className }: HeaderProps) {
  return (
    <header className={`bg-white shadow-sm border-b ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">
              saneatsu.me
            </h1>
          </div>

          {/* Navigation */}
          {navigation.length > 0 && (
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">Hello, {user.name}</span>
                <UserAvatar 
                  name={user.name}
                  avatar={user.avatar}
                  size="sm"
                />
              </div>
            ) : (
              <button className="text-sm text-gray-500 hover:text-gray-900">
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
