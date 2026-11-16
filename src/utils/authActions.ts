import type { User } from 'firebase/auth';
export async function createUserProfileDocument(user: User) {
  await fetch('/api/profile', { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
}
