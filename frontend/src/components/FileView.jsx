import PropTypes from 'prop-types';
import React from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { logOut } from '../actions';
import { secureKy } from '../entities/secure-ky';
import { store } from '../store';
import DirItem from './fileview/DirItem';
import FileTree from './fileview/FileTree';

/**
 * The diff overview component acts as a wrapper to
 * diff view components. It's basically a list of files
 * and their changes.
 */
class FileView extends React.Component {
  state = {
    isLoaded: false,
    files: {},
  };

  componentDidMount() {
    this.componentDidUpdate();
  }

  static getDerivedStateFromProps(props, state) {
    return { ...state, error: null };
  }

  componentDidUpdate(prevProps) {
    const { version, docuId } = this.props;
    // You don't have to do this check first, but it can help prevent an unneeded render
    let lastVersion = null;

    if (prevProps) {
      lastVersion = prevProps.version;
    }

    if (version && lastVersion !== version) {
      const fetchFiles = async () => {
        const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${version}/files`).json();
        this.setState({
          isLoaded: true,
          files: json.data,
        });
      };

      fetchFiles().catch((error) => {
        if (error.response && error.response.status === 403) {
          store.dispatch(logOut());
        }

        this.setState({
          isLoaded: true,
          error,
        });
      });
    }
  }

  render() {
    const {
      error, isLoaded, files,
    } = this.state;

    if (error) {
      return (
        <div>
          Error:
          {' '}
          {error.message}
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div>
          Loading...
        </div>
      );
    }

    if (!files.length) {
      return (
        <Row className="mt-4">
          <Col>
            No files found
          </Col>
        </Row>
      );
    }

    const newEntry = (dir) => (dir ? { dir: true, children: {} } : { dir: false });

    const result = [];
    const level = { result };
    files.forEach((pathEntry) => {
      // On every path entry, resolve using the base object
      const splitPath = pathEntry.path.split('/');
      const last = splitPath[splitPath.length - 1];

      splitPath.reduce((pathObject, pathName) => {
        // For each path name we come across, use the existing or create a subpath

        // Then return that subpath for the next operation

        if (!pathObject[pathName]) {
          pathObject[pathName] = { result: [] }; //eslint-disable-line
          const entry = newEntry(last === pathName ? pathEntry.dir : true);
          entry.name = pathName;
          entry.children = pathObject[pathName].result;
          pathObject.result.push(entry);
        }

        return pathObject[pathName];
      }, level);

      // Return the base object for suceeding paths, or for our final value
    });

    const root = newEntry(true);
    root.name = '/';
    root.children = result;

    return (
      <Row className="mt-3">
        <Col lg={12}>
          <DirItem name="/" openState>
            <FileTree data={root} />
          </DirItem>
        </Col>
      </Row>
    );
  }
}

FileView.defaultProps = {
};

FileView.propTypes = {
  docuId: PropTypes.number.isRequired,
  version: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  version: state.endRevision ? state.endRevision.branch : '',
});

export default hot(module)(connect(mapStateToProps)(FileView));
