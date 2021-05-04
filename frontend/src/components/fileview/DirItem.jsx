import { Alert } from 'bootstrap';
import PropTypes from 'prop-types';
import React from 'react';
import { hot } from 'react-hot-loader';
import { logOut } from '../../actions';
import { secureKy } from '../../entities/secure-ky';
import { store } from '../../store';
import FileItem from './FileItem';

/**
 * The diff overview component acts as a wrapper to
 * diff view components. It's basically a list of files
 * and their changes.
 */
class DirItem extends React.Component {
  state = {
    isLoaded: false,
    files: [],
    isOpen: false,
  };

  constructor(props) {
    super(props);

    this.state.isOpen = props.openState;
  }

  componentDidMount() {
    this.componentDidUpdate();
  }

  static getDerivedStateFromProps(props, state) {
    return { ...state, error: null };
  }

  componentDidUpdate(prevProps) {
    const { version, docuId, path } = this.props;
    // You don't have to do this check first, but it can help prevent an unneeded render
    let lastVersion = null;

    if (prevProps) {
      lastVersion = prevProps.version;
    }

    if (version && lastVersion !== version) {
      const fetchFiles = async () => {
        const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${version}/files/${path}`).json();

        this.setState({
          files: json.data,
          isLoaded: true,
        });
      };

      fetchFiles().catch((error) => {
        if (error.response && error.response.status === 403) {
          store.dispatch(logOut());
        }

        this.setState({
          error,
          isLoaded: true,
        });
      });
    }
  }

  render() {
    const {
      error, files, isOpen, isLoaded,
    } = this.state;

    const { name, docuId, version } = this.props;

    const toggle = (e) => {
      e.preventDefault();
      this.setState({ isOpen: !isOpen });
    };

    const state = isOpen ? 'open' : 'closed';
    const icon = isOpen ? (<i className="fas fa-folder-open" />) : (<i className="fas fa-folder" />);

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    let content = 'Loading...';

    if (isLoaded) {
      content = files.map((item) => {
        const iname = item.path.split(/(\\|\/)/g).pop();

        if (item.dir) {
          return (
            <DirItem
              key={item.path}
              name={iname}
              docuId={docuId}
              path={item.path}
              version={version}
            />
          );
        }
        return <FileItem key={item.path} name={iname} path={item.path} />;
      });
    }

    if (!content.length) {
      content = 'This folder is empty...';
    }

    return (
      <div className={`folder-wrap mt-2 mb-2 ${state}`}>
        <div className="folder-label" onClick={toggle} role="button" tabIndex="0" onKeyDown={toggle}>
          {icon}
          {' '}
          <strong>{name}</strong>
        </div>
        <div className="folder-children">
          {content}
        </div>
      </div>
    );
  }
}

DirItem.defaultProps = {
  openState: false,
};

DirItem.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  openState: PropTypes.bool,
  docuId: PropTypes.number.isRequired,
  version: PropTypes.string.isRequired,
};

export default hot(module)(DirItem);
