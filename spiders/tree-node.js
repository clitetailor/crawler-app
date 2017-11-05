class TreeNode {
  constructor(data = {}) {
    this.data = data;
    this.children = {};
  }

  insertData(path, data) {
    if (Array.isArray(path)) {
      if (path.length === 1) {
        this.children[path[0]] = new TreeNode(data);
      }

      if (path.length > 1) {
        if (this.children[path[0]] === undefined) {
          const newNode = new TreeNode();

          this.children[path[0]] = newNode;
          newNode.insertNode(path.slice(1), data);
        } else {
          this.children[path[0]].data = data;
        }
      }
    }
  }

  findNode(path) {
    if (Array.isArray(path)) {
      if (path.length === 0) {
        return this;
      }

      if (path.length > 0) {
        const childNode = this.children[path[0]];

        if (childNode && childNode.findNode) {
          return childNode.findNode(path.slice(1));
        }
      }
    }
  }
}

module.exports = TreeNode;