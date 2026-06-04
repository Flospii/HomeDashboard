export default defineNuxtRouteMiddleware(async (to) => {
  const { fetchUser } = useDirectusAuth();
  const user = useDirectusUser();

  if (!user.value) {
    try {
      await fetchUser();
    } catch (e) {
      // Not authenticated
    }
  }

  if (!user.value) {
    return navigateTo('/login');
  }
});
