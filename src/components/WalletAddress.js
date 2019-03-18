import React from 'react';
import QRCode from 'qrcode.react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import HathorAlert from './HathorAlert';
import wallet from '../utils/wallet';
import { connect } from "react-redux";


const mapStateToProps = (state) => {
  return { lastSharedAddress: state.lastSharedAddress };
};


class WalletAddress extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: true,
    }
  }

  generateNewAddress = (e) => {
    e.preventDefault();
    // We check if the next address was already generated, otherwise we generate, in case we can do it
    if (wallet.hasNewAddress()) {
      wallet.getNextAddress();
    } else {
      if (wallet.canGenerateNewAddress()) {
        wallet.generateNewAddress();
      } else {
        this.refs.alertError.show(3000);
      }
    }
  }

  downloadQrCode = (e) => {
    e.currentTarget.href = document.getElementsByTagName('canvas')[0].toDataURL();
    e.currentTarget.download = "QrCode.png";
  }

  copied = (text, result) => {
    if (result) {
      // If copied with success
      this.refs.alertCopied.show(1000);
    }
  }

  render() {
    const renderAddress = () => {
      return (
        <div className="d-flex flex-column align-items-center address-wrapper">
          <QRCode onClick={this.openQrCode} size={200} value={`hathor:${this.props.lastSharedAddress}`} />
          <span ref="address" className="mt-1">
            {this.props.lastSharedAddress}
            <CopyToClipboard text={this.props.lastSharedAddress} onCopy={this.copied}>
              <i className="fa fa-clone pointer ml-1" title="Copy to clipboard"></i>
            </CopyToClipboard>
          </span> 
          <a className="new-address" onClick={(e) => this.generateNewAddress(e)} href="true">Generate new address</a>
          <a className="download-qrcode" href="true" onClick={(e) => this.downloadQrCode(e)}>Download</a>
        </div>
      );
    }

    return (
      <div>
        {this.state.loaded ? renderAddress() : null}
        <HathorAlert ref="alertCopied" text="Copied to clipboard!" type="success" />
        <HathorAlert ref="alertError" text="You must use an old address before generating new ones" type="danger" />
      </div>
    );
  }
}

export default connect(mapStateToProps)(WalletAddress);