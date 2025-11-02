import os
import json
import sys

# Ensure UTF-8 encoding for console output on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Define directories and file types for detailed content extraction
INCLUDE_DIRS = [
    "client",
    "server",
]
INCLUDE_EXTENSIONS = [
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".css",
    ".html",
    ".ipynb"   # Added .ipynb extension
]

EXCLUDE_FILES = [

    ".gitignore",
    ".env",
    "requirements.txt",
    "README.md",
    "poetry.lock",
    "localrtt_microservices.py",
    "microservices-app-code-files.txt",
    "yarn.lock",
    "next-env.d.ts",
    ".eslintrc.json",
    "postcss.config.mjs",
    "tailiwind.config.json",
    "system_documentation.md",
    "project_structure.txt",
    "project.txt",  # Prevent recursion
    "code_base.py",
    "secret-account-key.json"
      # Exclude the script itself
]

# Directories you don’t want to see in the tree
EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "public",
    "build",
    ".next",
    "venv",
    ".venv",
    "__pycache__",
    "Reference Papers",
}

def get_file_folder_structure(repo_path: str) -> str:
    """
    Walk repo_path top-down and build a tree of all folders & files,
    excluding any names in EXCLUDE_DIRS.
    """
    structure = ""
    for root, dirs, files in os.walk(repo_path, topdown=True):
        # filter out unwanted directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        level = root.replace(repo_path, "").count(os.sep)
        indent = " " * 4 * level
        structure += f"{indent}{os.path.basename(root)}/\n"

        subindent = " " * 4 * (level + 1)
        for name in sorted(files):
            structure += f"{subindent}{name}\n"
    return structure

def parse_ipynb_content(content):
    """
    Parse Jupyter notebook content and extract code and markdown cells.
    """
    try:
        notebook = json.loads(content)
        parsed_content = ""

        for i, cell in enumerate(notebook.get('cells', [])):
            cell_type = cell.get('cell_type', '')
            source = cell.get('source', [])

            if isinstance(source, list):
                source = ''.join(source)

            if cell_type == 'markdown':
                parsed_content += f"# Markdown Cell {i+1}:\n{source}\n\n"
            elif cell_type == 'code':
                outputs = cell.get('outputs', [])
                parsed_content += f"# Code Cell {i+1}:\n{source}\n"

                # Include outputs if they exist
                if outputs:
                    parsed_content += "# Output:\n"
                    for output in outputs:
                        if 'text' in output:
                            if isinstance(output['text'], list):
                                parsed_content += ''.join(output['text']) + "\n"
                            else:
                                parsed_content += output['text'] + "\n"
                        elif 'data' in output and 'text/plain' in output['data']:
                            text_plain = output['data']['text/plain']
                            if isinstance(text_plain, list):
                                parsed_content += ''.join(text_plain) + "\n"
                            else:
                                parsed_content += text_plain + "\n"
                parsed_content += "\n"

        return parsed_content
    except json.JSONDecodeError:
        return "Error: Could not parse notebook JSON"
    except Exception as e:
        return f"Error parsing notebook: {str(e)}"

def extract_code_files(repo_path):
    """
    Extract and compile contents from code files, adding headers for each file.
    """
    compiled_contents = ""

    # Append the file/folder structure
    compiled_contents += get_file_folder_structure(repo_path)

    for root, dirs, files in os.walk(repo_path, topdown=True):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if file in EXCLUDE_FILES:
                continue
            if any(file.endswith(ext) for ext in INCLUDE_EXTENSIONS):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        compiled_contents += "---\n"
                        compiled_contents += (
                            f"File: {os.path.relpath(file_path, start=repo_path)}\n\n"
                        )

                        # Special handling for Jupyter notebooks
                        if file.endswith(".ipynb"):
                            compiled_contents += "```python\n"
                            notebook_content = f.read()
                            parsed_notebook = parse_ipynb_content(notebook_content)
                            compiled_contents += parsed_notebook + "\n"
                        else:
                            compiled_contents += "```"
                            if file.endswith(".py"):
                                compiled_contents += "python"
                            elif file.endswith((".ts", ".tsx")):
                                compiled_contents += "typescript"
                            elif file.endswith((".js", ".jsx")):
                                compiled_contents += "javascript"
                            elif file.endswith(".yml"):
                                compiled_contents += "yaml"
                            elif file.endswith((".css", ".scss")):
                                compiled_contents += "css"
                            elif file.endswith(".md"):
                                compiled_content += "markdown"
                            compiled_contents += "\n"
                            compiled_contents += f.read() + "\n"

                        compiled_contents += "```\n\n"
                except UnicodeDecodeError:
                    compiled_contents += "---\n"
                    compiled_contents += (
                        f"File: {os.path.relpath(file_path, start=repo_path)}\n"
                    )
                    compiled_contents += (
                        "Content: Skipped due to unsupported encoding\n\n"
                    )
    return compiled_contents

if __name__ == "__main__":
    # Hardcoded repository path
    repo_path = r"C:\Users\Asus\OneDrive\Desktop\bishh\Disha-Darshak-AI" # Your repository path
    tree = get_file_folder_structure(repo_path)
    # output_file = "project_structure.txt"
    # try:
    #     with open(output_file, "w", encoding="utf-8") as f:
    #         f.write(tree)
    #     print(f"Project structure written to {output_file}")
    # except Exception as e:
    #     print(f"Error writing to {output_file}: {e}")

    # Optional: Enable this to extract file contents as well
    
    code_files_content = extract_code_files(repo_path)
    output_file = "project.txt"
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(code_files_content)
        print(f"Project structure and code written to {output_file}")
    except Exception as e:
        print(f"Error writing to {output_file}: {e}")
    