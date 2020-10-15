import React from "react";
import { loadSubApp } from "subapp-react";

interface Demo1Props {
  data?: string,
}
const style = { padding: "5px", border: "solid", marginLeft: "15%", marginRight: "15%" };

const Demo1: React.Component = (props: Demo1Props): React.Component => {
  return (
    <p style={style}>subapp demo1 </p>
  );

};



//   <p>subapp demo1 < /p>
// props: { JSON.stringify(props) }
// <p>
//   <a href="https://wmlink.wal-mart.com/electrode" > Electrode Docs < /a>
//     < /p>
//     < /div>
//   );
// };



export default loadSubApp({
  Component: Demo1,
  name: "Demo1",
  prepare: () => {
    return { data: "hello from demo1" };
  }
});
