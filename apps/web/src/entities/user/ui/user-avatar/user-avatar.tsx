interface UserAvatarProps {
  /** User's name for alt text */
  name: string;
  /** Avatar image URL */
  avatar?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

export function UserAvatar({ name, avatar, size = 'md', className }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`
        rounded-full flex items-center justify-center bg-gray-200 text-gray-700 font-medium
        ${sizeClasses[size]}
        ${className || ''}
      `}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
