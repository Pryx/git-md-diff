import PropTypes from 'prop-types';
import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { hot } from 'react-hot-loader';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { logOut } from '../actions';
import accessLevels from '../constants/access-levels';
import Documentation from '../entities/documentation';
import secureKy from '../entities/secure-ky';
import { store } from '../store';

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
    const { user, accesslvl } = this.state;
    const access = Object.entries(accessLevels).map((v) => ({ label: v[0], value: v[1] }));

    return (
      <div>
        <Row>
          <Col>
            <AsyncSelect
              value={user}
              loadOptions={(val) => this.getOptionsAsync(val).catch((error) => {
                if (error.response && error.response.status === 403) {
                  store.dispatch(logOut());
                }
                return [];
              })}
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
            <Button variant="success" className="float-right">Add</Button>
          </Col>
        </Row>
      </div>
    );
  }
}

UserAdd.propTypes = {
  docu: PropTypes.shape(Documentation.getShape()).isRequired,
};

export default hot(module)(UserAdd);
