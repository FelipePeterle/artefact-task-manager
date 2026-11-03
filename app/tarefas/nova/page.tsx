import React from "react";
import { Metadata } from "next";
import { TaskForm } from "@/components/TaskForm";

export const metadata: Metadata = {
  title: "Nova Tarefa • Artefact Task Manager",
  description: "Cadastrar uma nova tarefa no gerenciador de produtividade.",
};

export default function NovaTarefaPage() {
  return <TaskForm mode="create" />;
}
