import React from 'react';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Make React globally available for legacy tests that assume it
global.React = React;

afterEach(() => {
  cleanup();
});
