import React from "react";
import { Metadata } from "next";
import { TaskForm } from "@/components/TaskForm";

export const metadata: Metadata = {
  title: "New Task • Artefact Task Manager",
  description: "Create a new task in the productivity task manager.",
};

export default function NovaTarefaPage() {
  return <TaskForm mode="create" />;
}
