import {TreeItem} from "./TreeItem.jsx";
import "./About.css";

function Details() {
  return (
    <ul style={{fontSize: "14px", height: "90%"}}>
      <li style={{paddingBottom: "10px"}}>
        <span>Name2Tree: tree.bairui.dev</span>
      </li>
      <li style={{paddingBottom: "10px"}}>
        <span>APack: apack.bairui.dev</span>
      </li>
      <li style={{paddingBottom: "10px"}}>
        <span>Charming.js: charmingjs.org</span>
      </li>
      <li style={{paddingBottom: "10px"}}>
        <span>GitHub: @pearmini</span>
      </li>
      <li style={{paddingBottom: "10px"}}>
        <span>Instagram: @subairui24</span>
      </li>
    </ul>
  );
}
function APack() {
  return <TreeItem name="AB" style={{width: "calc(100% - 10px)", height: "calc(100% - 10px)"}} />;
}

function EdgeCases() {
  return (
    <TreeItem name="ego" options={{stamp: false}} style={{width: "calc(100% - 10px)", height: "calc(100% - 10px)"}} />
  );
}

function Rose() {
  return (
    <TreeItem name="AB" options={{stamp: false}} style={{width: "calc(100% - 10px)", height: "calc(100% - 10px)"}} />
  );
}

function ToTree() {
  return (
    <TreeItem
      name="AB"
      options={{stamp: false, count: true}}
      style={{width: "calc(100% - 10px)", height: "calc(100% - 10px)"}}
    />
  );
}

function ToASCII() {
  return (
    <div
      style={{
        fontSize: "18px",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        justifyContent: "center",
        height: "90%",
        fontWeight: "lighter",
      }}
    >
      <div>A &nbsp;--&gt; 65</div>
      <div>B &nbsp;--&gt; 66</div>
      <div>AB --&gt; 6566</div>
    </div>
  );
}

export function About() {
  return (
    <div className="about-container">
      <div className="features-flex">
        <div className="feature-row">
          <div className="feature-square">
            <span>1.Convert the input string into ASCII codes.</span>
            <ToASCII />
          </div>
          <div className="feature-square">
            <span>2.Draw a tree based on the ASCII codes.</span>
            <ToTree />
          </div>
          <div className="feature-square">
            <span>3.Merge branches into mathematical rose.</span>
            <Rose />
          </div>
        </div>
        <div className="feature-row">
          <div className="feature-square">
            <span>4.Optimize edge cases.</span>
            <EdgeCases />
          </div>
          <div className="feature-square">
            <span>5.Render the signature using APack.</span>
            <APack />
          </div>
          <div className="feature-square">
            <span>6.More details...</span>
            <Details />
          </div>
        </div>
      </div>
    </div>
  );
}
