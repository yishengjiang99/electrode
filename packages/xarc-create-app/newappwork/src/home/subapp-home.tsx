import React from "react";
import { loadSubApp } from "subapp-react";
import electrodePng from "../images/electrode.png";

const Home = (props: {
  url:string
}): React.Component => (
  <h1 style={{ textAlign: "center" }}>
Hello from{" "}
<a href={props.url}>
  Electrode <img src={electrodePng} />
</a>
</h1>)

export default loadSubApp({ Component: Home, props: {url:"https://www.electrode.io" }, name: "Home" });
