const executeCode = async (req, res) => {
    try {
        const { code, language, stdin } = req.body;

        // JDoodle versioning and mappings
        const langMap = {
            javascript: 'nodejs',
            python: 'python3',
            java: 'java',
            cpp: 'cpp'
        };

        const versionMap = {
            javascript: '0', 
            python: '4', // python 3.9
            java: '4', // JDK 17
            cpp: '5' // C++ 17
        };

        const jdoodleLang = langMap[language];
        const jdoodleVersion = versionMap[language] || '0';

        if (!jdoodleLang) {
            return res.status(400).json({ error: "Unsupported language" });
        }

        // Fetch is available in Node.js 18+
        const response = await fetch('https://api.jdoodle.com/v1/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientId: process.env.JDOODLE_CLIENT_ID,
                clientSecret: process.env.JDOODLE_CLIENT_SECRET,
                script: code,
                language: jdoodleLang,
                versionIndex: jdoodleVersion,
                stdin: stdin || ""
            })
        });

        const data = await response.json();

        // JDoodle data.output contains the result.
        if (data.error) {
            return res.json({ error: data.error });
        }

        return res.json({ output: data.output || "Execution completed with no output." });
        
    } catch (error) {
        console.error("JDoodle Execution Error:", error);
        res.status(500).json({ error: "Server compile error" });
    }
};

module.exports = { executeCode };
