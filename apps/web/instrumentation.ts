import { validateEnv } from '@design-editor/common-types';

export async function register(): Promise<void> {
  validateEnv('web');
}
