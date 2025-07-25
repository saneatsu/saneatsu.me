import type { Meta, StoryObj } from '@storybook/react';
import { HomeView } from './home-page';

const meta = {
  title: 'Views/HomeView',
  component: HomeView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HomeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};