// Mock audit logs data
const mockAuditLogs = [
  {
    id: 1,
    timestamp: "2024-03-15T10:30:00Z",
    action: "CREATE",
    user: "john.doe@example.com",
    resource: "Todo",
    status: "completed",
    details: "Created new todo: Complete project documentation",
  },
  {
    id: 2,
    timestamp: "2024-03-15T11:15:00Z",
    action: "UPDATE",
    user: "jane.smith@example.com",
    resource: "Todo",
    status: "completed",
    details: "Updated todo status to completed: Review pull requests",
  },
  {
    id: 3,
    timestamp: "2024-03-15T12:00:00Z",
    action: "DELETE",
    user: "john.doe@example.com",
    resource: "Todo",
    status: "completed",
    details: "Deleted todo: Old task",
  },
  {
    id: 4,
    timestamp: "2024-03-15T13:45:00Z",
    action: "CREATE",
    user: "alice.johnson@example.com",
    resource: "Todo",
    status: "pending",
    details: "Created new todo: Implement new feature",
  },
  {
    id: 5,
    timestamp: "2024-03-15T14:30:00Z",
    action: "UPDATE",
    user: "bob.wilson@example.com",
    resource: "Todo",
    status: "failed",
    details: "Failed to update todo: Network error",
  },
  {
    id: 6,
    timestamp: "2024-03-15T15:00:00Z",
    action: "CREATE",
    user: "john.doe@example.com",
    resource: "Todo",
    status: "completed",
    details: "Created new todo: Fix bug in authentication",
  },
  {
    id: 7,
    timestamp: "2024-03-15T16:15:00Z",
    action: "UPDATE",
    user: "jane.smith@example.com",
    resource: "Todo",
    status: "completed",
    details: "Updated todo priority: High priority task",
  },
  {
    id: 8,
    timestamp: "2024-03-15T17:00:00Z",
    action: "DELETE",
    user: "alice.johnson@example.com",
    resource: "Todo",
    status: "completed",
    details: "Deleted todo: Duplicate task",
  },
  {
    id: 9,
    timestamp: "2024-03-15T18:30:00Z",
    action: "CREATE",
    user: "bob.wilson@example.com",
    resource: "Todo",
    status: "pending",
    details: "Created new todo: Write unit tests",
  },
  {
    id: 10,
    timestamp: "2024-03-15T19:00:00Z",
    action: "UPDATE",
    user: "john.doe@example.com",
    resource: "Todo",
    status: "completed",
    details: "Updated todo description: Add more details",
  },
];

// Mock API function to get audit logs
export const getAuditLogs = async (token) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate authentication check
  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  // Return mock data
  return mockAuditLogs;
};

// Export mock data for testing
export { mockAuditLogs }; 