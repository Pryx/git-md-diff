import PropTypes from 'prop-types';
import React from 'react';
import { Alert, Dropdown } from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import { hot } from 'react-hot-loader';
import { logoutUser, secureKy } from '../../entities/secure-ky';
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
    this.handleNewPage = this.handleNewPage.bind(this);
    this.handleNewFolder = this.handleNewFolder.bind(this);
  }

  componentDidMount() {
    const { isOpen } = this.state;
    if (isOpen) {
      this.componentDidUpdate();
    }
  }

  static getDerivedStateFromProps(props, state) {
    return { ...state, error: null };
  }

  componentDidUpdate(prevProps, prevState) {
    const { version, docuId, path } = this.props;
    // You don't have to do this check first, but it can help prevent an unneeded render
    let lastVersion = null;

    const { isOpen } = this.state;
    if (!isOpen) {
      return;
    }

    if (prevProps) {
      lastVersion = prevProps.version;
    }

    let shouldRefresh = false;
    if (prevState) {
      shouldRefresh = !prevState.isOpen && isOpen;
    }

    if ((version && lastVersion !== version) || shouldRefresh) {
      const fetchFiles = async () => {
        const json = await secureKy().get(`${window.env.api.backend}/documentations/${docuId}/${version}/files/${path}`).json();

        this.setState({
          files: json.data,
          isLoaded: true,
        });
      };

      fetchFiles().catch((error) => {
        if (error.response && error.response.status === 403) {
          logoutUser();
          return;
        }

        this.setState({
          error,
          isLoaded: true,
        });
      });
    }
  }

  handleNewPage() {
    const { path, docuId, version } = this.props;
    const createPage = async (fileName) => {
      const filePath = path.length ? `${path}/${fileName}` : fileName;
      this.setState({
        isLoaded: false,
      });
      const response = await secureKy().put(`${window.env.api.backend}/documentations/${docuId}/${version}/pages/${filePath}.mdx`,
        {
          json: { content: '' },
        }).json();

      if (response.success) {
        this.componentDidUpdate();
      } else {
        this.setState({
          isLoaded: true,
          error: response.error,
        });
      }
    };

    this.dialog.show({
      title: 'New page',
      body: `Please enter the name of your new file. 
        Please do not enter the extension, it will be automatically added.`,
      bsSize: 'md',
      prompt: Dialog.TextPrompt({ initialValue: 'new-page', placeholder: 'File name', required: true }),
      actions: [
        Dialog.CancelAction(),
        Dialog.OKAction(() => {
          createPage(this.dialog.value);
        }),
      ],
    });
  }

  handleNewFolder() {
    const { path, docuId, version } = this.props;
    const createPage = async (fileName) => {
      const filePath = path.length ? `${path}/${fileName}` : fileName;
      this.setState({
        isLoaded: false,
      });
      const response = await secureKy().put(`${window.env.api.backend}/documentations/${docuId}/${version}/pages/${filePath}/.gitkeep`,
        {
          json: { content: '' },
        }).json();

      if (response.success) {
        this.componentDidUpdate();
      } else {
        this.setState({
          isLoaded: true,
          error: response.error,
        });
      }
    };

    this.dialog.show({
      title: 'New folder',
      body: 'Please enter the name of your new folder.',
      bsSize: 'md',
      prompt: Dialog.TextPrompt({ initialValue: 'new-folder', placeholder: 'Folder name', required: true }),
      actions: [
        Dialog.CancelAction(),
        Dialog.OKAction(() => {
          createPage(this.dialog.value);
        }),
      ],
    });
  }

  render() {
    const {
      error, files, isOpen, isLoaded,
    } = this.state;

    const { name, docuId, version } = this.props;

    const toggle = (e) => {
      console.log(e.target.classList);
      if (!e.target.classList.contains('dropdown')) {
        e.preventDefault();
        this.setState({ isOpen: !isOpen });
        this.componentDidUpdate();
      }
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
        <div className="folder-label clearfix" onClick={toggle} role="button" tabIndex="0" onKeyDown={toggle}>
          {icon}
          {' '}
          <strong>{name}</strong>
          <Dropdown className="float-right">
            <Dropdown.Toggle size="sm" variant="secondary">
              <i className="fas fa-ellipsis-h" />
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item as="button" onClick={this.handleNewPage}>New page</Dropdown.Item>
              <Dropdown.Item as="button" onClick={this.handleNewFolder}>New Folder</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <div className="folder-children">
          {content}
        </div>
        <Dialog ref={(component) => { this.dialog = component; }} />
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
