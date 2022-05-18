import React, { useEffect, useState } from "react";
interface Var {
  kind: "Var";
  name: string;
}
interface Bool {
  kind: "Bool";
  value: boolean;
}
interface Operation {
  kind: "And" | "Or";
}
type Atom = Bool | Var | Operation;
type Context = { [argname: string]: boolean };
interface Ast {
  left?: Ast;
  right?: Ast;
  data: Atom;
}

/* ...todo:
a system for defining logical operations 
(not, and, or... more if you want) that can be passed:
 - selected args by name: (X and Y)
 - constant values not dependent on args: (true and X)
 - other operations: ((X and Y) or Z) 
 */

function lookup(name: string, ctx: Context): boolean | void {
  if (name in ctx) {
    return ctx[name];
  }
  return undefined;
}

function evaluate(tree: Ast | void, ctx: Context): boolean | void {
  if (tree === undefined) {
    return undefined;
  }
  switch (tree.data.kind) {
    case "Bool":
      return tree.data.value;
    case "Var":
      return lookup(tree.data.name, ctx);
    case "Or": {
      const lVal = evaluate(tree.left, ctx);
      const rVal = evaluate(tree.right, ctx);
      return lVal || rVal;
    }
    case "And": {
      const lVal = evaluate(tree.left, ctx);
      const rVal = evaluate(tree.right, ctx);
      return lVal && rVal;
    }
  }
}

function ContextView(props: {
  argName: string;
  ctx: Context;
  setCtx: React.Dispatch<React.SetStateAction<Context>>;
}): JSX.Element {
  const [name, setName] = useState(props.argName);

  function handleInputChange(newName: string) {
    const newCtx = Object.assign({}, props.ctx);
    newCtx[newName] = props.ctx[name];
    delete newCtx[name];
    props.setCtx(newCtx);
    setName(newName);
  }

  function handleSelect(choice: string) {
    props.setCtx({ ...props.ctx, [name]: choice === "true" });
  }

  function handlePress() {
    props.setCtx(({ [name]: value, ...rest }) => rest);
  }

  return (
    <div>
      <input
        ref={(input) => input && input.focus()}
        value={name}
        onChange={(e) => handleInputChange(e.target.value)}
      />
      <select onChange={(e) => handleSelect(e.target.value)}>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
      <button onClick={handlePress}>X</button>
    </div>
  );
}

function ContextBuilder(props: {
  ctx: Context;
  setCtx: React.Dispatch<React.SetStateAction<Context>>;
}): JSX.Element {
  return (
    <div>
      {Object.keys(props.ctx).map((it) => (
        <ContextView
          key={it}
          argName={it}
          ctx={props.ctx}
          setCtx={props.setCtx}
        />
      ))}
    </div>
  );
}

function OpSelect(props: {
  showOr: boolean;
  setTree: React.Dispatch<React.SetStateAction<Ast | void>>;
}): JSX.Element {
  return (
    <select>
      <option value="and">and</option>
      <option value="or">or</option>
    </select>
  );
}

function VarSelect(props: {
  ctx: Context;
  setTree: React.Dispatch<React.SetStateAction<Ast | void>>;
}): JSX.Element {
  function handleChange(choice: string) {
    console.log(choice);
    props.setTree((prevTree) => {
      return {
        ...prevTree,
        data: { kind: "Var", name: choice }
      };
    });
  }
  return (
    <select onChange={(e) => handleChange(e.target.value)}>
      {Object.keys(props.ctx).map((it) => (
        <option key={it} value={it}>
          {it}
        </option>
      ))}
    </select>
  );
}

function BoolSelect(props: {
  setTree: React.Dispatch<React.SetStateAction<Ast | void>>;
}): JSX.Element {
  function handleChange(choice: string) {
    console.log("hi");
    props.setTree((prevTree) => {
      return {
        ...prevTree,
        data: { kind: "Bool", value: choice === "true" }
      };
    });
  }
  return (
    <select onChange={(e) => handleChange(e.target.value)}>
      <option value="true">true</option>
      <option value="false">false</option>
    </select>
  );
}

function TreeBuilder(props: {
  tree: Ast | void;
  ctx: Context;
  setTree: React.Dispatch<React.SetStateAction<Ast | void>>;
}): JSX.Element {
  function handleSelect(choice: string) {
    switch (choice) {
      case "constant":
        props.setTree({ data: { kind: "Bool", value: true } });
        break;
      case "argument":
        props.setTree({
          data: { kind: "Var", name: Object.keys(props.ctx)[0] }
        });
        break;
      case "and":
        props.setTree({
          data: { kind: "Or" }
        });
        break;
      case "or":
        props.setTree({
          data: { kind: "And" }
        });
        break;
    }
  }

  if (props.tree === undefined) {
    return (
      <>
        <select onChange={(e) => handleSelect(e.target.value)}>
          <option>select...</option>
          <option value="constant">constant</option>
          <option value="argument">argument</option>
          <option value="and">and</option>
          <option value="or">or</option>
        </select>
      </>
    );
  }

  function getSelect(kind: string) {
    switch (kind) {
      case "And":
        return <OpSelect showOr={false} setTree={props.setTree} />;
      case "Or":
        return <OpSelect showOr setTree={props.setTree} />;
      case "Bool":
        return <BoolSelect setTree={props.setTree} />;
      case "Var":
        return <VarSelect ctx={props.ctx} setTree={props.setTree} />;
      default:
        return <></>;
    }
  }

  function handleDelete() {
    props.setTree(undefined);
  }

  return (
    <>
      {getSelect(props.tree.data.kind)}
      <button onClick={handleDelete}>X</button>
    </>
  );

  // return (
  //   <div>
  //     <DynamicSelect
  //       kind={props.tree.data.kind}
  //       setTree={props.setTree}
  //       ctx={props.ctx}
  //     />
  //   </div>
  // );
}

export default function App() {
  const [ctx, setCtx] = useState<Context>({});
  const [tree, setTree] = useState<Ast | void>();
  // const tree: Ast = {
  //   data: { kind: "And" },
  //   left: {
  //     data: { kind: "Var", name: "Hi" }
  //   },
  //   right: {
  //     data: { kind: "Var", name: "wrong" }
  //   }
  // };

  useEffect(() => {
    console.log(tree);
  }, [tree]);

  const res = evaluate(tree, ctx);
  const resText = res === undefined ? "undefined" : res ? "true" : "false";

  function addArg() {
    setCtx({
      ...ctx,
      "new arg": true
    });
  }

  return (
    <div>
      <div>
        <ContextBuilder ctx={ctx} setCtx={setCtx} />
        <button onClick={addArg}>+ add arg </button>
      </div>
      <TreeBuilder tree={tree} setTree={setTree} ctx={ctx} />
      <div> result: {resText}</div>
    </div>
  );
}

// const tree: Ast = {
//   data: we{ kind: "And" },
//   left: {
//     data: { kind: "Var", name: "Hi" }
//   },
//   right: {
//     data: { kind: "Var", name: "wrong" }
//   }
// };
// const ctx = {
//   Hi: true
// };
// const res = evaluate(tree, ctx);
// console.log(res);
