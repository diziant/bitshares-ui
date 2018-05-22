import React, {Component} from "react";
import AltContainer from "alt-container";
import Translate from "react-translate-component";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import CachedPropertyStore from "stores/CachedPropertyStore";
import BlockchainStore from "stores/BlockchainStore";
import WalletDb from "stores/WalletDb";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import "intro.js/introjs.css";
import guide from "intro.js";

class Footer extends React.Component {

    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        synced: React.PropTypes.bool.isRequired
    };

    static defaultProps = {
        dynGlobalObject: "2.1.0"
    };

    static contextTypes = {
        router: React.PropTypes.object
    };

    constructor(props){
        super(props);

        this.state = {};
    }

    componentDidMount() {
        this.checkNewVersionAvailable.call(this);

        this.downloadLink = "https://bitshares.org/download";
    }

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.dynGlobalObject !== this.props.dynGlobalObject ||
            nextProps.backup_recommended !== this.props.backup_recommended ||
            nextProps.rpc_connection_status !== this.props.rpc_connection_status ||
            nextProps.synced !== this.props.synced
        );
    }

    checkNewVersionAvailable(){
        if (__ELECTRON__) {
            fetch("https://api.github.com/repos/bitshares/bitshares-ui/releases/latest").then((res)=>{
                return res.json();
            }).then(function(json){
                let oldVersion = String(json.tag_name);
                let newVersion = String(APP_VERSION);
                if((oldVersion !== newVersion)){
                    this.setState({newVersion});
                }
            }.bind(this));
        }
    }

    downloadVersion(){
        var a = document.createElement("a");
        a.href = this.downloadLink;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.style = "display: none;";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    launchIntroJS() {
        const translator = require("counterpart");

        var hintData = document.querySelectorAll("[data-intro]");
        var theme = SettingsStore.getState().settings.get("themes");

        if(hintData.length == 0) {
            window.open("http://docs.bitshares.org/bitshares/user/index.html", "_blank");
        } else {
            guide.introJs().setOptions({
                tooltipClass: theme,
                highlightClass: theme,
                showBullets: false,
                hideNext: true,
                hidePrev: true,
                nextLabel: translator.translate("walkthrough.next_label"),
                prevLabel: translator.translate("walkthrough.prev_label"),
                skipLabel: translator.translate("walkthrough.skip_label"),
                doneLabel: translator.translate("walkthrough.done_label")
            }).start();
        }
    }

    render() {
        // const { state } = this;
        // const {synced} = this.props;
        const connected = !(this.props.rpc_connection_status === "closed");

        // Current Node Details
        let currentNode = SettingsStore.getState().settings.get("activeNode");
        let currentNodePing = SettingsStore.getState().apiLatencies[currentNode];

        // let block_height = this.props.dynGlobalObject.get("head_block_number");
        let head_block_id = this.props.dynGlobalObject.get("head_block_id");
        // let version_match = APP_VERSION.match(/2\.0\.(\d\w+)/);
        // let version = version_match ? `.${version_match[1]}` : ` ${APP_VERSION}`;
        // let updateStyles = {display: "inline-block", verticalAlign: "top"};
        // let logoProps = {};

        let latencyStatus = "latency-bad";

        if (currentNodePing >= 300 && currentNodePing < 500) {
            latencyStatus = "latency-normal";
        }

        if (currentNodePing < 300) {
            latencyStatus = "latency-good";
        }

        const latencyIdicator = (
            <span className="footer-latency-indicator">
                <div className={"latency-indicator indicator-small " + latencyStatus}/>
                <div className={"latency-indicator indicator-medium " + latencyStatus}/>
                <div className={"latency-indicator indicator-big " + latencyStatus}/>
            </span>
        );

        return (
            <div className="footer-fixed">
                <div className="show-for-medium grid-block shrink footer">
                    <div className="align-justify grid-block">
                        <div className="footer-inner">
                            <div className="footer-connection-status">
                                { latencyIdicator }
                                <span className="footer-latency">
                                    <Translate content="footer.latency" />
                                    {!connected ? "-" : !currentNodePing ? "-" : " " + currentNodePing + " ms"}
                                </span>
                                                
                                { 
                                    !connected ?
                                        <span className="footer-latency-status footer-warning"><Translate content="footer.disconnected" /></span> :
                                        <span className="footer-latency-status footer-success"><Translate content="footer.connected" /></span> 
                                }
                            </div>
                            <div className="footer-head-block-id">
                            { head_block_id }
                            </div>
                        </div>
                    </div>
                </div>
                <div className="introjs-launcher show-for-small-only" onClick={() => { this.launchIntroJS(); }}>Help</div>
            </div>
        );
    }

    onBackup() {
        this.context.router.push("/wallet/backup/create");
    }

    onBackupBrainkey() {
        this.context.router.push("/wallet/backup/brainkey");
    }

    onAccess() {
        SettingsActions.changeViewSetting({activeSetting: 6});
        this.context.router.push("/settings");
    }
}
Footer = BindToChainState(Footer, {keep_updating: true});

class AltFooter extends Component {

    render() {
        var wallet = WalletDb.getWallet();
        return <AltContainer
            stores={[CachedPropertyStore, BlockchainStore, WalletDb]}
            inject ={{
                backup_recommended: ()=>
                (wallet && ( ! wallet.backup_date || CachedPropertyStore.get("backup_recommended"))),
                rpc_connection_status: ()=> BlockchainStore.getState().rpc_connection_status
            }}
            ><Footer {...this.props}/>
        </AltContainer>;
    }
}

export default AltFooter;
