import 'dotenv/config';
import inquirer from 'inquirer';
import { createAuth, getAuthDatabase } from '../src/lib/server/auth-config';

type Answers = {
	name: string;
	email: string;
	username: string;
	password: string;
};

const auth = createAuth();
const db = getAuthDatabase();

const answers = await inquirer.prompt<Answers>([
	{
		type: 'input',
		name: 'name',
		message: 'Name:',
		validate: (value: string) => value.trim().length > 0 || 'Name is required'
	},
	{
		type: 'input',
		name: 'email',
		message: 'Email:',
		filter: (value: string) => value.trim().toLowerCase(),
		validate: (value: string) => /.+@.+\..+/.test(value.trim()) || 'Enter a valid email'
	},
	{
		type: 'input',
		name: 'username',
		message: 'Username:',
		filter: (value: string) => value.trim().toLowerCase(),
		validate: (value: string) => value.trim().length >= 3 || 'Username must be at least 3 characters'
	},
	{
		type: 'password',
		name: 'password',
		message: 'Password:',
		mask: '*',
		validate: (value: string) => value.length >= 8 || 'Password must be at least 8 characters'
	}
]);

const isFirstUser = (db.query('SELECT count(*) AS count FROM users').get() as { count: number }).count === 0;

try {
	const result = await auth.api.signUpEmail({
		body: {
			name: answers.name.trim(),
			email: answers.email,
			username: answers.username,
			displayUsername: answers.username,
			password: answers.password
		},
		headers: new Headers()
	});

	if (isFirstUser) {
		db.query('UPDATE items SET user_id = $userId WHERE user_id IS NULL').run({
			$userId: Number(result.user.id)
		});
	}

	console.log(`Created user ${result.user.name} (${result.user.email}, ${result.user.username})`);
} catch (error) {
	if (error && typeof error === 'object' && 'body' in error) {
		const body = (error as { body?: { message?: string } }).body;
		console.error(body?.message ?? error);
	} else {
		console.error(error instanceof Error ? error.message : error);
	}
	process.exit(1);
}
