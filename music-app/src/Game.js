import React, { useState, useEffect, useRef } from "react";
import Matter from "matter-js";
import * as Tone from "tone";

//create a synth and connect it to the main output (your speakers)
const synth = new Tone.Synth().toDestination();

const Game = () => {
  const myRef = useRef(null);

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

    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    var render = Render.create({
      element: myRef.current,
      engine: engine,
      options: {
        width: 1000,
        height: 400,
        wireframes: true,
      },
    });

    // WALLS
    World.add(engine.world, [
      Bodies.rectangle(500, 0, 1000, 50, {
        isStatic: true,
        restitution: 1,
        // friction: 1,
      }),
      Bodies.rectangle(500, 400, 1000, 50, {
        isStatic: true,
        restitution: 1,
        // friction: 1,
      }),
      Bodies.rectangle(1000, 200, 30, 400, {
        isStatic: true,
        opacity: 0,
        isSensor: true,
        label: "end",
      }),
      Bodies.rectangle(-50, 200, 30, 400, {
        isStatic: true,
        opacity: 0,
        isSensor: true,
        label: "end",
      }),
    ]);

    // BALL
    var ballA = Bodies.circle(5, 50, 15, {
      restitution: 1,
      inertia: 0,
      friction: 0,
      frictionAir: 0,
      force: { x: 0.01, y: 0.01 },
      motion: 1,
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
    var noteToChange = {};
    var mouseDownX;
    var mouseDownY;

    Matter.Events.on(mouseConstraint, "mousedown", function (event) {
      mouseDownX = event.mouse.position.x;
      mouseDownY = event.mouse.position.y;
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
      console.log("notes", notes);

      if (bodiesUnder.length === 0) {
        const newNote = Bodies.rectangle(mouseX, mouseY, 80, 30, {
          label: "note",
        });
        notes = [...notes, newNote];

        World.add(engine.world, newNote);
      } else {
        const everything = Composite.allBodies(engine.world);
        const bodyToRemove = Composite.get(
          engine.world,
          bodiesUnder[0].id,
          "body",
        );
        bodyToRemove.isStatic = false;
        if (bodyToRemove) {
          if (mouseX === mouseDownX && mouseY === mouseDownY) {
            Composite.remove(engine.world, bodyToRemove);
            const newNotes = notes.filter(
              (note) => note.id !== bodyToRemove.id,
            );
            notes = newNotes;
            console.log("notes1", notes);
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
        console.log("note", note);
        note.isStatic = true;
        //play a middle 'C' for the duration of an 8th note
        synth.triggerAttackRelease("C4", "8n");
      }
      // detect if the end is reached
      if (a.label === "end" || b.label === "end") {
        console.log("eve", event.pairs);
        Composite.add(
          engine.world,
          Bodies.circle(5, 50, 15, {
            restitution: 1,
            inertia: 0,
            friction: 0,
            frictionAir: 0,
            force: { x: 0.01, y: 0.01 },
            motion: 1,
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
        console.log("note", note);
        note.isStatic = false;
      }
    });

    Engine.run(engine);

    Render.run(render);

    console.log(engine.world);
  }, []);

  return <div ref={myRef} />;
};
export default Game;
