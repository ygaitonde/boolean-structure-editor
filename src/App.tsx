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
interface ToSelect {
  kind: "ToSelect";
}
type Atom = Bool | Var | Operation | ToSelect;
type Context = { [argname: string]: boolean };
interface Ast {
  left?: Ast;
  right?: Ast;
  data: Atom;
}

// maybe redundant
function lookup(name: string, ctx: Context): boolean | undefined {
  if (name in ctx) {
    return ctx[name];
  }
  return undefined;
}

function evaluate(tree: Ast | undefined, ctx: Context): boolean | undefined {
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
  setTree: React.Dispatch<React.SetStateAction<Ast | undefined>>;
}): JSX.Element {
  function handleChange(choice: string) {
    props.setTree((prevTree) => {
      console.log("hi :)");
      return {
        ...prevTree,
        data: { kind: choice === "and" ? "And" : "Or" }
      };
    });
  }
  return (
    <select
      defaultValue={props.showOr ? "or" : "and"}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="and">and</option>
      <option value="or">or</option>
    </select>
  );
}

function VarSelect(props: {
  ctx: Context;
  setTree: React.Dispatch<React.SetStateAction<Ast | undefined>>;
}): JSX.Element {
  function handleChange(choice: string) {
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
  setTree: React.Dispatch<React.SetStateAction<Ast | undefined>>;
}): JSX.Element {
  function handleChange(choice: string) {
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
  tree: Ast | undefined;
  ctx: Context;
  setTree: React.Dispatch<React.SetStateAction<Ast | undefined>>;
}): JSX.Element {
  const [leftTree, setLeftTree] = useState(props.tree?.left);
  const [rightTree, setRightTree] = useState(props.tree?.left);

  useEffect(() => {
    if (props.tree?.data === undefined) {
      return;
    }
    props.setTree({
      ...props.tree,
      left: leftTree
    });
  }, [leftTree]);

  useEffect(() => {
    if (props.tree?.data === undefined) {
      return;
    }
    props.setTree({
      ...props.tree,
      right: rightTree
    });
  }, [rightTree]);

  function handleSelect(choice: string) {
    switch (choice) {
      case "constant":
        props.setTree({
          data: { kind: "Bool", value: true }
        });
        setLeftTree(undefined);
        setRightTree(undefined);
        break;
      case "argument":
        props.setTree({
          data: { kind: "Var", name: Object.keys(props.ctx)[0] }
        });
        setLeftTree(undefined);
        setRightTree(undefined);
        break;
      case "and":
        props.setTree({
          data: { kind: "And" }
        });
        setLeftTree({ data: { kind: "ToSelect" } });
        setRightTree({ data: { kind: "ToSelect" } });
        break;
      case "or":
        props.setTree({
          data: { kind: "Or" }
        });
        setLeftTree({ data: { kind: "ToSelect" } });
        setRightTree({ data: { kind: "ToSelect" } });
        break;
    }
  }

  if (props.tree === undefined) {
    return <></>;
  }

  if (props.tree?.data.kind === "ToSelect") {
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
    props.setTree({ data: { kind: "ToSelect" } });
  }

  return (
    <>
      <div>
        {getSelect(props.tree.data.kind)}
        <button onClick={handleDelete}>X</button>
      </div>
      {!!leftTree ? (
        <div style={{ marginLeft: "10px" }}>
          <TreeBuilder tree={leftTree} setTree={setLeftTree} ctx={props.ctx} />
        </div>
      ) : (
        <></>
      )}
      {!!rightTree ? (
        <div style={{ marginLeft: "10px" }}>
          <TreeBuilder
            tree={rightTree}
            setTree={setRightTree}
            ctx={props.ctx}
          />
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

export default function App() {
  const [ctx, setCtx] = useState<Context>({});
  const [tree, setTree] = useState<Ast | undefined>({
    data: { kind: "ToSelect" },
    left: undefined,
    right: undefined
  });

  // useEffect(() => {
  //   console.log(tree);
  // }, [tree]);

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
