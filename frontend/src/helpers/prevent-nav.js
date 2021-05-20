import useLocation from 'wouter/use-location';

let modified = false;

/**
 * Prevents nav if modified flag set
 */
export const useLocationWithConfirmation = () => {
  const [location, setLocation] = useLocation();

  return [
    location,
    (newLocation) => {
      let perfomNavigation = true;
      if (modified) {
        perfomNavigation = window.confirm('Are you sure you want to leave?'); //eslint-disable-line
      }

      if (perfomNavigation) {
        modified = false;
        setLocation(newLocation);
      }
    },
  ];
};

/* eslint-disable */
/**
 * Prevents nav if page has modified content
 * @returns Unload text
 */
window.onbeforeunload = () => {
  if (modified) return 'Are you sure you want to leave?';
};
/* eslint-enable */

/**
 * Set prevent nav flag
 */
export const preventNav = () => {
  modified = true;
};

/**
 * Unset prevent nav flag
 */
export const allowNav = () => {
  modified = false;
};
