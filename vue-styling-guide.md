# Vue Styling Guide

## Intro

This document outlines the preferred structure and style for Vue components in our projects. It is designed to ensure consistency, readability, and maintainability across our codebase. The following sections detail the organization of various parts of a Vue component.

## Template Structure

- Leave an empty line between neighboring HTML tags of the same hierarchy level.

## Script Structure

- Leave an empty line between each of the script block sections defined below.

### Dependency Imports

- If the file uses any libraries, import them at the top of the script section.
- Order these from those that are used in the core of the component to those that are used less frequently or are more specific.

### Component Imports

### Service Imports

### Type Imports

## Style Structure

<!-- definePageMeta
defineProps
defineModel
defineEmits
--------------------
built-in composable destructuring
composable destructuring
store destructuring
service destructuring
inner composable destructuring
--------------------
template refs
refs/computed properties
functions
watchers
inner composables
onBeforeMount/onMounted
onBeforeUnmount/onUnmounted
Immediate executions (what used to be created())
defineExpose -->
