import type { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from './login-form';

const meta = {
  title: 'Features/Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: (email: string, password: string) => {
      console.log('Login attempt:', { email, password });
    },
  },
};

export const Loading: Story = {
  args: {
    onSubmit: (email: string, password: string) => {
      console.log('Login attempt:', { email, password });
    },
    isLoading: true,
  },
};

export const WithError: Story = {
  args: {
    onSubmit: (email: string, password: string) => {
      console.log('Login attempt:', { email, password });
    },
    error: 'Invalid email or password. Please try again.',
  },
};
