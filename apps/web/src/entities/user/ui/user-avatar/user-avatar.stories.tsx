import type { Meta, StoryObj } from '@storybook/react';
import { UserAvatar } from './user-avatar';

const meta = {
  title: 'Entities/User/UserAvatar',
  component: UserAvatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof UserAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithAvatar: Story = {
  args: {
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    size: 'md',
  },
};

export const WithoutAvatar: Story = {
  args: {
    name: 'Jane Smith',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    name: 'Small User',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    name: 'Large User',
    size: 'lg',
  },
};

export const LongName: Story = {
  args: {
    name: 'Alexander Thompson-Williams',
    size: 'md',
  },
};
