import { db } from "../drizzle/connection";
import { postsTable } from "../drizzle/schema";

const titles = [
  "Getting Started with Next.js",
  "Understanding React Hooks",
  "TypeScript Best Practices",
  "Building Scalable Web Applications",
  "Introduction to Database Design",
  "API Development with REST",
  "GraphQL vs REST APIs",
  "Modern CSS Techniques",
  "JavaScript Performance Optimization",
  "Server-Side Rendering Explained",
  "Authentication Strategies",
  "State Management in React",
  "Docker for Developers",
  "CI/CD Pipeline Setup",
  "Web Security Best Practices",
  "Progressive Web Apps Guide",
  "Testing React Components",
  "Microservices Architecture",
  "Cloud Infrastructure Basics",
  "Database Optimization Tips",
  "Advanced TypeScript Patterns",
  "Building RESTful APIs",
  "Frontend Performance Tuning",
  "Backend Architecture Design",
  "Working with Databases",
  "Version Control with Git",
  "Deployment Strategies",
  "Monitoring and Logging",
  "Error Handling Patterns",
  "Code Review Guidelines",
];

const descriptions = [
  "A comprehensive guide to building modern web applications with the latest technologies and best practices.",
  "Learn how to effectively use this powerful feature to improve your development workflow.",
  "Explore proven techniques and patterns that will help you write better, more maintainable code.",
  "Deep dive into the core concepts and practical implementations for real-world projects.",
  "Everything you need to know to get started, from basics to advanced topics.",
  "Common pitfalls and how to avoid them in your next project.",
  "A detailed walkthrough with examples and use cases for everyday development.",
  "Optimize your workflow with these tips and tricks from industry experts.",
  "Understanding the fundamentals and applying them to solve complex problems.",
  "Step-by-step tutorial for implementing this feature in your application.",
  "Best practices for building scalable and maintainable systems.",
  "A comparison of different approaches and when to use each one.",
  "Learn from real-world examples and case studies in production environments.",
  "Essential knowledge for every developer working in this technology stack.",
  "Improve your skills with practical exercises and hands-on examples.",
  "Discover the latest trends and technologies shaping the future of development.",
  "Master the art of writing clean, efficient, and robust code.",
  "A complete reference guide with detailed explanations and code samples.",
  "Common mistakes developers make and how to avoid them in your projects.",
  "Advanced techniques for optimizing performance and user experience.",
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function generateRandomTitle(): string {
  const baseTitle = getRandomElement(titles);
  const variation = Math.floor(Math.random() * 100);
  return variation > 0 ? `${baseTitle} (Part ${variation})` : baseTitle;
}

async function seedPosts() {
  console.log("🌱 Seeding posts...");

  // Delete all existing posts
  console.log("🗑️  Deleting existing posts...");
  await db.delete(postsTable);
  console.log("✅ Existing posts deleted!");

  const posts = Array.from({ length: 1000 }, (_, i) => ({
    title: generateRandomTitle(),
    description: getRandomElement(descriptions),
  }));

  // Insert in batches of 100 for better performance
  const batchSize = 100;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    await db.insert(postsTable).values(batch);
    console.log(`✅ Inserted posts ${i + 1} to ${Math.min(i + batchSize, posts.length)}`);
  }

  console.log("✅ Posts seeding completed!");
}

export default seedPosts;
