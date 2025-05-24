# Memi

_**[🚧 Still Work in Progress]**_

Your personal knowledge AI Assistant.

## Why?

So here's a problem.

- I have a lot of notes related to my work like (todo, meeting notes, writing draft for social media and blog)  and more.
- Sometime I couldn't find what I want and the organization is messy. Also my files is scaterred in multiple place.
- Also I spend sometime in the weekend to learn something new but then a few weeks later I fogot, and sometime when learning I also forgot to take a notes.

The goal of this project is to be a place to access my brain. The file would be just in my local computer. This app will have chat interface in terminal and it will be the main place for me to talk with ai, save my notes and all of my interaction with ai that related to save a text.

## What this app do?

This app will do 3 simple thing:

1. Chat with ai from terminal
2. Generate memory from my chat history
3. Import document based on folder path and generate memory

The chat will be able to:
1. Reply to my message
2. Give me recomendations based on its memory
3. Tools to acess external data and more useful action for me (still no idea the list of the tools)

## Setup

Tech stack of this project is.

LLM:
1. Anthropic
2. OpenAI

Language:
1. Typescript
2. Simple text memory

Installation for development.

```bash
npm install
```

Setup apikey.
```bash
cp .env.example .env
```

Update `ANTHROPIC_API_KEY` env value.

Run the app.
```bash
npm run dev
```
