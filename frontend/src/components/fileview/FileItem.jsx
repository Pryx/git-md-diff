import PropTypes from 'prop-types';
import React from 'react';
import { Button, Alert } from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Link } from 'wouter';
import { secureKy } from '../../entities/secure-ky';


/**
 * The diff overview component acts as a wrapper to
 * diff view components. It's basically a list of files
 * and their changes.
 */
class FileItem extends React.Component {
  state = {
    isLoaded: false,
    files: [],
  };

  constructor(props) {
    super(props);

    this.state.isOpen = props.openState;
    this.handleDeleteFile = this.handleDeleteFile.bind(this);
  }

  componentDidMount() {
    this.componentDidUpdate();
  }

  static getDerivedStateFromProps(props, state) {
    return { ...state, error: null };
  }

  handleDeleteFile() {
    const { path, docuId, version } = this.props;
    const deleteFile = async () => {
      const response = await secureKy().delete(`${window.env.api.backend}/documentations/${docuId}/${version}/pages/${path}`).json();

      if (response.success) {
        this.setState({
          isDeleted: true
        });
      } else {
        this.setState({
          isLoaded: true,
          error: response.error,
        });
      }
    };

    this.dialog.show({
      title: 'Delete file',
      body: `Are you sure you want to delete file ${path}.`,
      bsSize: 'md',
      actions: [
        Dialog.CancelAction(),
        Dialog.Action(
          'Delete',
          () => deleteFile(),
          'btn-danger'
        )
      ],
    });
  }

  render() {
    const {
      error, isDeleted
    } = this.state;

    const { name, docuId, version, path } = this.props;

    if (isDeleted){
      return null;
    }

    if (error){
      return (
        <div className="file">
          <Alert variant="danger">Couldn&amp;t delete file - it is probably already deleted. Please try refreshing this page.</Alert>
        </div>
      );
    }

    if (name.endsWith('.md') || name.endsWith('.mdx')) {
      return (
        <div className="file">
          <i className="fas fa-file-alt" />
          {' '}
          <Link href={`/documentation/${docuId}/edit/v/${version}/f/${path}`}>{name}</Link>
          <Button size="sm" variant="danger" className="float-right" onClick={this.handleDeleteFile}>
            <i className="fas fa-trash" />
          </Button>
          <Dialog ref={(component) => { this.dialog = component; }} />
        </div>
      );
    }
    return (
      <div className="file">
        <i className="fas fa-file" />
        {' '}
        <span>{name}</span>
        <Button size="sm" variant="danger" className="float-right" onClick={this.handleDeleteFile}>
          <i className="fas fa-trash" />
        </Button>
        <Dialog ref={(component) => { this.dialog = component; }} />
      </div>
    );
  }
}

FileItem.propTypes = {
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  docuId: PropTypes.number.isRequired,
  version: PropTypes.string.isRequired,
};

const mapStateToProps = (state) => ({
  docuId: state.docuId,
  version: state.endRevision ? state.endRevision.branch : '',
});

export default hot(module)(connect(mapStateToProps)(FileItem));
