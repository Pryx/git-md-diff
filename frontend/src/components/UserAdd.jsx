import { hot } from 'react-hot-loader';
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import AsyncSelect from 'react-select/async';
import ky from 'ky';
import Select from 'react-select';
import accessLevels from '../constants/access-levels'
import { Button, Col, Row } from 'react-bootstrap';

/**
 * Diff page component is a wrapper to diff overview and commit selectors.
 * Currently it stores the info about current repository and selected commits
 * and passess it to wrapped components.
 */
class DocumentationSettings extends React.Component {
  state = {
    success: false,
    error: "",
    accesslvl: null,
    user: null
  }

  async getOptionsAsync(search) {
    if (!search) {
      return;
    }

    const { docu } = this.props;
    const json = await ky(`/api/documentations/provider/${docu.provider}/users/${encodeURIComponent(search)}`).json();
    const mapped = json.data.map((c) => ({ label: `${c.name} (${c.username})`, value: c.id }));
    return mapped
  }

  render() {
    const { user, accesslvl } = this.state;
    const access = Object.entries(accessLevels).map((v) => ({ label: v[0], value: v[1] }))

    return (
      <div>
        <Row>
          <Col>
            <AsyncSelect
              value={user}
              loadOptions={(val) => this.getOptionsAsync(val)}
              placeholder="Start typing..."
              onChange={(user) => {
                this.setState({ user })
              }} />
          </Col>
          <Col>
            <Select
              options={access}
              placeholder="Access level"
              value={accesslvl}
              onChange={(accesslvl) => {
                this.setState({ accesslvl })
              }} />
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

DocumentationSettings.propTypes = {
  docuList: PropTypes.array
};

const mapStateToProps = (state) => (
  {
    docuList: state.docuList
  }
);

export default hot(module)(connect(mapStateToProps)(DocumentationSettings));