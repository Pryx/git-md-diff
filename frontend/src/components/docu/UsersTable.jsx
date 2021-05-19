import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Button, Form, OverlayTrigger, Table, Tooltip,
} from 'react-bootstrap';
import Dialog from 'react-bootstrap-dialog';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { accessLevelsString } from '../../constants/access-levels';
import { getPossiblyHTTPErrorMessage, secureKy } from '../../helpers/secure-ky';
import User from '../../shapes/user';

/**
 * A table of users
 */
class UsersTable extends React.Component {
  state = {
    updating: false,
    message: null,
  };

  constructor(props) {
    super(props);

    this.changeUserPerm = this.changeUserPerm.bind(this);
    this.handleRemoveUser = this.handleRemoveUser.bind(this);
    this.removeUser = this.removeUser.bind(this);
  }

  /**
 * Shows the dialog before user removal
 * @param {Object} user The user object
 */
  handleRemoveUser(user) {
    this.dialog.show({
      title: 'Remove user',
      body: `Do you want to remove user ${user.name} (${user.email})?`,
      bsSize: 'md',
      actions: [
        Dialog.CancelAction(),
        Dialog.Action(
          'Remove user',
          () => this.removeUser(user.id),
          'btn-danger',
        ),
      ],
    });
  }

  /**
   * This removes the user from the documentation
   * @param {number} userId ID of the user to remove
   */
  removeUser(userId) {
    const { docuId, callback } = this.props;
    const remove = async () => {
      const json = await secureKy().delete(`${window.env.api.backend}/documentations/${docuId}/users/${userId}`);

      if (json.success === false) {
        throw Error("Couldn't remove user!");
      }

      callback();
    };

    remove().catch(async (error) => {
      const errorMessage = await getPossiblyHTTPErrorMessage(error);
      if (errorMessage === null) return; // Expired tokens

      this.setState({
        message: { type: 'danger', content: errorMessage },
      });
    });
  }

  async changeUserPerm(uid, e) {
    const { callback, docuId } = this.props;
    try {
      this.setState({
        updating: true,
      });

      await secureKy().put(`${window.env.api.backend}/documentations/${docuId}/users/${uid}`,
        { json: { level: e.target.value } });

      this.setState({
        updating: false,
        message: { type: 'success', content: 'Successfully updated user' },
      });
    } catch (error) {
      this.setState({
        updating: false,
        message: { type: 'danger', content: 'Error updating user. Please try again later.' },
      });
    }
    callback();
  }

  render() {
    const { users, currentUser } = this.props;
    const { message, updating } = this.state;

    let alert = null;
    if (message) {
      alert = <Alert variant={message.type} className="mb-3">{message.content}</Alert>;
    }

    const unknownUser = (
      <OverlayTrigger overlay={(
        <Tooltip>
          The user has not yet registered in this app, therefore we do not know their email.
        </Tooltip>
      )}
      >
        <span className="help">
          unknown
          <i className="fas fa-info-circle ml-2" />
        </span>
      </OverlayTrigger>
    );

    const tableContent = users.map((u) => (
      <tr key={u.id}>
        <td>{u.name}</td>
        <td>
          {u.email || unknownUser}
        </td>
        <td>
          {currentUser.id === u.id && accessLevelsString[u.accessLevel]}
          {currentUser.id !== u.id && (
            <Form.Control
              as="select"
              size="sm"
              onChange={(e) => this.changeUserPerm(u.id, e)}
              disabled={updating}
              defaultValue={u.accessLevel}
            >
              {
                Object.entries(accessLevelsString)
                  .map(([k, v]) => <option value={k} key={k}>{v}</option>)
              }
            </Form.Control>
          )}
        </td>
        <td>
          {currentUser.id !== u.id
            && <Button variant="danger" size="sm" onClick={() => this.handleRemoveUser(u)}><i className="fas fa-trash" /></Button>}
        </td>
      </tr>
    ));

    return (
      <div className="mt-3">
        {alert}
        <Table className="user-table" responsive striped bordered hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Access level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableContent}
          </tbody>
        </Table>
        <Dialog ref={(component) => { this.dialog = component; }} />
      </div>
    );
  }
}

UsersTable.defaultProps = {
};

UsersTable.propTypes = {
  users: PropTypes.arrayOf(PropTypes.shape(User)).isRequired,
  docuId: PropTypes.number.isRequired,
  currentUser: PropTypes.shape(User).isRequired,
  callback: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => (
  {
    docuId: state.docuId,
  }
);

export default hot(module)(connect(mapStateToProps)(UsersTable));
