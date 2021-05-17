import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert, Button, Col, Row,
} from 'react-bootstrap';
import { hot } from 'react-hot-loader';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import accessLevels from '../constants/access-levels';
import Documentation from '../entities/documentation';
import { logoutUser, secureKy } from '../entities/secure-ky';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class UserAdd extends React.Component {
  state = {
    accesslvl: null,
    user: null,
  };

  constructor(props) {
    super(props);

    this.handleAdd = this.handleAdd.bind(this);
  }

  handleAdd(e) {
    e.preventDefault();
    const { docu, callback } = this.props;
    const { accesslvl, user } = this.state;

    const addUser = async () => {
      const json = await secureKy().put(`${window.env.api.backend}/documentations/${docu.id}/users/`, { json: { providerId: user.value, level: accesslvl.value } });

      if (json.success === false) {
        throw Error("Couldn't add user!");
      }

      this.setState({ accesslvl: null, user: null });
      callback();
    };

    if (!user) {
      this.setState({ error: 'You need to select a valid user' });
      return;
    }

    if (!accesslvl) {
      this.setState({ error: 'You need to select a valid access level' });
      return;
    }

    addUser().catch((error) => {
      if (error.response && error.response.status === 403) {
        logoutUser();
        return;
      }

      this.setState({
        error: error.toString(),
      });
    });
  }

  async getOptionsAsync(search) {
    if (!search) {
      return [];
    }

    const { docu } = this.props;
    const json = await secureKy().get(`${window.env.api.backend}/documentations/provider/${docu.provider}/users/${encodeURIComponent(search)}`).json();
    const mapped = json.data.map((c) => ({ label: `${c.name} (${c.username})`, value: c.id }));
    return mapped;
  }

  render() {
    const { user, accesslvl, error } = this.state;
    const access = Object.entries(accessLevels).map((v) => ({ label: v[0], value: v[1] }));

    let alert = '';
    if (error) {
      alert = (
        <Alert variant="danger">
          Error:
          {error}
        </Alert>
      );
    }

    return (
      <div>
        {alert}
        <Row>
          <Col>
            <AsyncSelect
              value={user}
              loadOptions={(val) => this.getOptionsAsync(val).catch(() => [])}
              placeholder="Start typing..."
              onChange={(u) => {
                this.setState({ user: u });
              }}
            />
          </Col>
          <Col>
            <Select
              options={access}
              placeholder="Access level"
              value={accesslvl}
              onChange={(lvl) => {
                this.setState({ accesslvl: lvl });
              }}
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <Button variant="success" className="float-right" onClick={this.handleAdd}>Add</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

UserAdd.propTypes = {
  docu: PropTypes.shape(Documentation.getShape()).isRequired,
  callback: PropTypes.func.isRequired,
};

export default hot(module)(UserAdd);
