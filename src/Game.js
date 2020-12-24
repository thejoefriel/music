import React, { useEffect, useRef } from "react";
import Matter from "matter-js";
import * as Tone from "tone";

//create a synth and connect it to the main output (your speakers)
const synth = new Tone.Synth().toDestination();

const Game = () => {
  const myRef = useRef(null);

  const decideNote = (x, y) => {
    const roundedWidth = Math.floor(x * y * 1000).toString()[0];
    const roundedHeight = Math.floor(x + y * 400).toString()[0];

    console.log("rounded", roundedHeight, roundedWidth);

    const keys = ["C", "D", "E", "F", "G", "A", "B"];
    const scales = [3, 4, 5];

    let key;
    let scale;
    if (roundedWidth > 7) {
      key = keys[6];
    } else {
      key = keys[roundedWidth - 1];
    }

    if (roundedHeight > 3) {
      scale = scales[2];
    } else {
      scale = scales[roundedHeight - 1];
    }

    return { key, scale };
  };

  const changeNote = (note) => {
    const { title1, title2 } = note;
    const keys = ["C", "D", "E", "F", "G", "A", "B"];

    const index = keys.findIndex((e) => e === title1);
    // move up a scale
    if (index === keys.length - 1) {
      note.title1 = keys[0];
      note.title2 = title2 + 1;
      return note;
    } else if (title1 === "B" && title2 === 5) {
      return null;
    }
    // move up a note
    else {
      note.title1 = keys[index + 1];
      return note;
    }
  };

  useEffect(() => {
    var Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint,
      Composite = Matter.Composite;

    var engine = Engine.create({
      // positionIterations: 20
    });

    var closed = false;

    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    var render = Render.create({
      element: myRef.current,
      engine: engine,
      options: {
        width: 880,
        height: 400,
        wireframes: false,
      },
    });

    // WALLS
    World.add(engine.world, [
      Bodies.rectangle(440, 0, 880, 50, {
        isStatic: true,
        restitution: 1,
        // friction: 1,
      }),
      Bodies.rectangle(440, 400, 880, 50, {
        isStatic: true,
        restitution: 1,
        // friction: 1,
        // label: "end",
      }),
      Bodies.rectangle(930, 400, 50, 880, {
        isStatic: true,
        opacity: 0,
        isSensor: true,
        label: "end",
      }),
      Bodies.rectangle(-50, 400, 50, 880, {
        isStatic: true,
        opacity: 0,
        // isSensor: true,
        // label: "end",
      }),
    ]);

    // BALL
    var ballA = Bodies.circle(0, 0, 15, {
      restitution: 1,
      inertia: 0,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
      force: { x: 0.01, y: 0.01 },
      motion: 1,
      density: 0.0005,
    });

    World.add(engine.world, [ballA]);

    // add mouse control
    var mouse = Mouse.create(render.canvas),
      mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: {
            visible: false,
          },
        },
      });

    World.add(engine.world, mouseConstraint);

    var notes = [];
    var mouseDownX;
    var mouseDownY;

    Matter.Events.on(mouseConstraint, "mousedown", function (event) {
      mouseDownX = event.mouse.position.x;
      mouseDownY = event.mouse.position.y;

      // check if any bodies underneath
      const bodiesUnder = Matter.Query.point(notes, {
        x: mouseDownX,
        y: mouseDownY,
      });

      // add key functions while holding down mouse
      if (bodiesUnder.length > 0) {
        document.addEventListener("keydown", function (e) {
          console.log("hey");
          if (e.keyCode === 82) {
            console.log("bo", bodiesUnder[0]);

            Matter.Body.rotate(bodiesUnder[0], 45);
          }
        });
      }
    });

    Matter.Events.on(mouseConstraint, "mouseup", function (event) {
      // get coordinates of mouse click
      const mouseX = event.mouse.position.x;
      const mouseY = event.mouse.position.y;

      // check if any bodies underneath
      const bodiesUnder = Matter.Query.point(notes, {
        x: mouseX,
        y: mouseY,
      });

      if (bodiesUnder.length === 0) {
        const chosenNote = decideNote(mouseX, mouseY);
        const newNote = Bodies.rectangle(mouseX, mouseY, 80, 30, {
          label: "note",
          title1: chosenNote.key,
          title2: chosenNote.scale,
          restitution: 1,
          density: 100,
        });
        notes = [...notes, newNote];

        World.add(engine.world, newNote);
      } else {
        const bodyToEdit = Composite.get(
          engine.world,
          bodiesUnder[0].id,
          "body",
        );
        bodyToEdit.isStatic = false;
        if (bodyToEdit) {
          if (mouseX === mouseDownX && mouseY === mouseDownY) {
            const newNote = changeNote(bodyToEdit);
            const newNoteArrBase = notes.filter(
              (note) => note.id !== bodyToEdit.id,
            );
            if (!newNote) {
              Composite.remove(engine.world, bodyToEdit);
              notes = newNoteArrBase;
            } else {
              notes = [...newNoteArrBase, newNote];
            }
          }
        }
      }
    });

    Matter.Events.on(engine, "collisionStart", function (event) {
      let a = event.pairs[0].bodyA;
      let b = event.pairs[0].bodyB;

      // detect if a note is hit
      if (a.label === "note" || b.label === "note") {
        const note = a.label === "note" ? a : b;
        const other = a.label === "note" ? b : a;
        note.isStatic = true;

        if (other.label === "ball" || other.label === "Circle Body") {
          //play note
          console.log("title", note, other);
          // synth.triggerAttackRelease(`${note.title1}${note.title2}`, "8n");
          const sampler = new Tone.Sampler({
            urls: {
              C4: "booC.mp3",
              D4: "booD.mp3",
              E4: "booE.mp3",
              F4: "booF.mp3",
              G4: "booG.mp3",
              A4: "booA.mp3",
              B4: "booB.mp3",
            },
            release: 1,
            baseUrl: "./",
          }).toDestination();

          Tone.loaded().then(() => {
            sampler.triggerAttackRelease([`${note.title1}4`], 3);
            synth.triggerAttackRelease(`${note.title1}${note.title2}`, "8n");
          });
          const yNeg = other.velocity.y < 0;
          const xNeg = other.velocity.x < 0;
          Matter.Body.applyForce(
            other,
            { x: other.position.x, y: other.position.y },
            { x: xNeg ? -0.01 : 0.01, y: yNeg ? -0.01 : 0.01 },
          );
        }
      }
      // detect if the end is reached
      if (a.label === "end" || b.label === "end") {
        Composite.add(
          engine.world,
          Bodies.circle(0, 50, 15, {
            restitution: 1,
            inertia: 0,
            friction: 0,
            frictionAir: 0,
            frictionStatic: 0,
            force: { x: 0.01, y: 0.01 },
            motion: 1,
            density: 0.0005,
          }),
        );
      }
    });

    Matter.Events.on(engine, "collisionEnd", function (event) {
      let a = event.pairs[0].bodyA;
      let b = event.pairs[0].bodyB;

      // detect if a note is hit
      if (a.label === "note" || b.label === "note") {
        const note = a.label === "note" ? a : b;
        note.isStatic = false;

        const body = a.label === "note" ? b : a;
        Matter.Body.applyForce(
          note,
          { x: body.position.x, y: body.position.y },
          { x: 0.02, y: 0.02 },
        );
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.keyCode === 32) {
        Composite.add(
          engine.world,
          Bodies.circle(0, 50, 15, {
            restitution: 1,
            inertia: 0,
            friction: 0,
            frictionAir: 0,
            frictionStatic: 0,
            force: { x: 0.01, y: 0.01 },
            motion: 1,
            density: 0.0005,
          }),
        );
      }
      if (e.keyCode === 83) {
        const allBodies = Composite.allBodies(engine.world);
        allBodies.forEach((body) => {
          if (body.label === "Circle Body" || body.label === "ball") {
            console.log("hey", body.velocity);
            const yNeg = body.velocity.y < 0;
            const xNeg = body.velocity.x < 0;
            Matter.Body.applyForce(
              body,
              { x: body.position.x, y: body.position.y },
              { x: xNeg ? -0.01 : 0.01, y: yNeg ? -0.01 : 0.01 },
            );
            console.log("hey5", body.velocity);
          }
        });
      }

      if (e.keyCode === 71) {
        engine.world.gravity.y = engine.world.gravity.y === 1 ? 0 : 1;
      }
      if (e.keyCode === 67) {
        if (closed === false) {
          Composite.add(engine.world, [
            Bodies.rectangle(880, 400, 50, 880, {
              isStatic: true,
              opacity: 0,
              // isSensor: true,
              // label: "end",
              label: "closed",
            }),
            Bodies.rectangle(0, 400, 50, 880, {
              isStatic: true,
              opacity: 0,
              // isSensor: true,
              // label: "end",
              label: "closed",
            }),
          ]);
          closed = true;
        } else {
          const allBodies = Composite.allBodies(engine.world);
          console.log("false");

          allBodies.forEach((body) => {
            if (body.label === "closed") {
              body.isSensor = "true";
              body.position = { x: 2000, y: 2000 };
            }
          });
          closed = false;
        }
      }
    });

    Engine.run(engine);

    Render.run(render);

    console.log(engine.world);
  }, []);

  return <div ref={myRef} />;
};
export default Game;
