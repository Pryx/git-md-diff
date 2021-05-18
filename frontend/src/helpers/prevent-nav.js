import useLocation from 'wouter/use-location';

let modified = false;

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
window.onbeforeunload = () => {
  if (modified) return 'Are you sure you want to leave?';
};
/* eslint-enable */

export const preventNav = () => {
  modified = true;
};

export const allowNav = () => {
  modified = false;
};
