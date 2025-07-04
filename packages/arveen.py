import matplotlib.pyplot as plt

# Sample data
x = [1, 2, 3, 4, 5]
y = [2, 3, 5, 7, 11]

# Create a simple line graph
plt.figure()
plt.plot(x, y, marker='o')
plt.xlabel('X values')
plt.ylabel('Y values')
plt.title('Simple Line Graph')
plt.grid(True)
plt.savefig("simple_graph.png")
print("Wrote simple_graph.png")

