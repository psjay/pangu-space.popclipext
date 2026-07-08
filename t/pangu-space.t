use strict;
use warnings;
use utf8;

use Encode qw(encode decode);
use FindBin;
use Test::More;

binmode STDOUT, ':encoding(UTF-8)';
binmode STDERR, ':encoding(UTF-8)';

my $script = $ENV{PANGU_SPACE_SCRIPT} || "$FindBin::Bin/../src/pangu-space.pl";
my $config = $ENV{PANGU_SPACE_CONFIG} || "$FindBin::Bin/../src/Config.plist";

{
	open my $fh, '<:encoding(UTF-8)', $config or die "Cannot read $config: $!";
	my $plist = do { local $/; <$fh> };
	like(
		$plist,
		qr{<key>Shell Script</key>\s*<string>#!/bin/sh\s+exec /usr/bin/perl pangu-space\.pl</string>},
		'inline shell script declares /bin/sh interpreter',
	);
}

sub url_encode {
	my ($text) = @_;
	return join '', map {
		my $char = chr($_);
		$char =~ /[A-Za-z0-9_.~-]/ ? $char : sprintf '%%%02X', $_;
	} unpack 'C*', encode('UTF-8', $text);
}

sub run_case {
	my ($name, $input) = @_;
	local $ENV{POPCLIP_URLENCODED_TEXT} = url_encode($input);
	my $output = `$^X "$script"`;
	is($?, 0, "$name exits cleanly");
	return decode('UTF-8', $output);
}

sub run_encoded_case {
	my ($name, $encoded_input) = @_;
	local $ENV{POPCLIP_URLENCODED_TEXT} = $encoded_input;
	my $output = `$^X "$script"`;
	is($?, 0, "$name exits cleanly");
	return decode('UTF-8', $output);
}

my @cases = (
	[
		'leaves text without CJK untouched',
		'Hello, world! 123',
		'Hello, world! 123',
	],
	[
		'inserts spaces around Latin words and numbers',
		'當你凝視著bug，bug也凝視著你123次',
		'當你凝視著 bug，bug 也凝視著你 123 次',
	],
	[
		'inserts spaces around ASCII punctuation symbols',
		'中文@user和价格$100以及A/B测试',
		'中文 @user 和价格 $100 以及 A/B 测试',
	],
	[
		'converts repeated punctuation after CJK to fullwidth',
		'你好!!!真的吗???可以,当然;好~结束',
		'你好！真的吗？可以，当然；好～结束',
	],
	[
		'converts ASCII punctuation between CJK to fullwidth',
		'甲:乙.丙',
		'甲：乙。丙',
	],
	[
		'keeps colon before uppercase answers fullwidth',
		'问题:A',
		'问题：A',
	],
	[
		'adds spacing after dots and ellipsis before CJK',
		'Wait...中文以及…中文',
		'Wait... 中文以及… 中文',
	],
	[
		'normalizes straight quotes around CJK text',
		'他说"中文OK"结束',
		'他说 "中文 OK" 结束',
	],
	[
		'converts curly double quotes to corner quotes after spacing',
		'中文“quote测试”结尾',
		'中文 「quote 测试」 结尾',
	],
	[
		'handles single quotes without breaking possessives',
		"中文's owner和'中文'",
		"中文's owner 和 ' 中文'",
	],
	[
		'adds spaces around hashtags',
		'前#标签#后和中文#tag结尾',
		'前 #标签# 后和中文 #tag 结尾',
	],
	[
		'adds spaces around operators',
		'中文+A和B+中文以及中文=1',
		'中文 + A 和 B + 中文以及中文 = 1',
	],
	[
		'matches pangu slash spacing behavior',
		'打开/Users/name/项目和A/中文',
		'打开 / Users/name/ 项目和 A / 中文',
	],
	[
		'adds spaces around brackets',
		'中文(test)和A(中文)以及中文[OK]',
		'中文 (test) 和 A (中文) 以及中文 [OK]',
	],
	[
		'normalizes middle dot variants',
		'中文 · English • 日本語 ‧ 한글',
		'中文・English・日本語・한글',
	],
	[
		'spaces Greek letters and percent units',
		'角度α中文增长100%YoY',
		'角度 α 中文增长 100% YoY',
	],
	[
		'preserves literal plus signs when URL encoded',
		'中文 A+B 测试',
		'中文 A+B 测试',
	],
	[
		'matches pangu Japanese and Hangul range behavior',
		'日本語abcと한글ABC',
		'日本語 abc と한글ABC',
	],
);

for my $case (@cases) {
	my ($name, $input, $expected) = @$case;
	is(run_case($name, $input), $expected, $name);
}

is(
	run_encoded_case('decodes raw plus signs from URL text', '%E4%B8%AD%E6%96%87+A+%E6%B5%8B%E8%AF%95'),
	'中文 A 测试',
	'decodes raw plus signs from URL text',
);

{
	local %ENV = %ENV;
	delete $ENV{POPCLIP_URLENCODED_TEXT};
	my $output = `$^X "$script" 2>&1`;
	my $status = $? >> 8;
	isnt($status, 0, 'missing POPCLIP_URLENCODED_TEXT exits non-zero');
	like($output, qr/POPCLIP_URLENCODED_TEXT is required/, 'missing env reports a useful error');
}

done_testing();
