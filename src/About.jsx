import {TreeItem} from "./TreeItem.jsx";
import "./About.css";

function Details({isAdmin}) {
  const maybeLink = (text, link) =>
    !isAdmin ? (
      <a href={link} style={{color: "inherit"}}>
        {text}
      </a>
    ) : (
      text
    );
  return (
    <ul style={{fontSize: "14px", height: "90%"}}>
      <li style={{paddingBottom: "10px"}}>
        <span>{maybeLink("GitHub: Source Code", "https://github.com/pearmini")}</span>
      </li>
      {isAdmin && (
        <li style={{paddingBottom: "10px"}}>
          <span>{maybeLink("Name2Tree", "https://tree.bairui.dev")}</span>
        </li>
      )}
      <li style={{paddingBottom: "10px"}}>
        <span>{maybeLink("APack: Signature Generator", "https://apack.bairui.dev")}</span>
      </li>
      <li style={{paddingBottom: "10px"}}>
        <span>{maybeLink("Charming.js: SVG Based Library", "https://charmingjs.org")}</span>
      </li>

      <li style={{paddingBottom: "10px"}}>
        <span>{maybeLink("Instagram: follow my works!", "https://www.instagram.com/subairui24")}</span>
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

export function About({isAdmin}) {
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
            <Details isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </div>
  );
}
